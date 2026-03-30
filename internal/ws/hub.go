package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a single WebSocket connection to FE.
type Client struct {
	hub  *Hub
	conn *websocket.Conn

	// Channel for sending events to this client.
	// Write goroutine reads from here and sends to conn.
	send chan WsEvent

	// (Optional) identity info for future filtering,
	// e.g. UserID / TenantID / list of subscribed InstanceIDs.
	// Can be left empty for initial version.
	// UserID string

	InstanceID string
}

// Hub stores all active clients and handles event broadcasting.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Register / unregister requests from clients.
	register   chan *Client
	unregister chan *Client

	// Broadcast is the event channel that will be sent to all clients.
	broadcast chan WsEvent

	// Mutex in case synchronous access to clients from outside Run() is needed.
	mu sync.RWMutex
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan WsEvent, 256), // small buffer to prevent blocking
	}
}

// Run must be executed in a separate goroutine.
// This loop will:
// - accept new clients (register)
// - remove disconnected clients (unregister)
// - send events to all clients (broadcast)
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()

		case event := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- event:
					// successfully sent to client buffer
				default:
					// if buffer is full, consider client problematic and disconnect
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register is used by WS handler when a new connection is created.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister is called when WS connection is closed.
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Publish implements RealtimePublisher.
// Other services just call this to send events to all clients.
func (h *Hub) Publish(event WsEvent) {
	// Ensure timestamp is set if not already.
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}
	h.broadcast <- event
}

// RealtimePublisher is the interface held by other services
// (whatsapp.go, QR handler) to avoid direct dependency on Hub.
type RealtimePublisher interface {
	Publish(event WsEvent)
	BroadcastToInstance(instanceID string, data map[string]interface{})
}

// NewClient creates a new Client object from a Gorilla WebSocket connection.
// This function does not start read/write goroutines; that's the WS handler's job.
// NewClient creates a new Client object from a Gorilla WebSocket connection.
func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		hub:        hub,
		conn:       conn,
		send:       make(chan WsEvent, 256),
		InstanceID: "", // default empty, will be set from handler
	}
}

// WritePump is a loop that sends events from the send channel to the WS connection.
// Usually called as a goroutine from the /ws handler.
func (c *Client) WritePump() {
	ticker := time.NewTicker(5 * time.Minute) // Ping every 5 minutes

	defer func() {
		ticker.Stop()
		c.hub.Unregister(c)
		_ = c.conn.Close()
	}()

	for {
		select {
		case event, ok := <-c.send:
			// Set a simple deadline to avoid hanging indefinitely.
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))

			if !ok {
				// Channel closed
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Encode WsEvent ke JSON.
			payload, err := json.Marshal(event)
			if err != nil {
				log.Printf("ws: failed to marshal event: %v", err)
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, payload); err != nil {
				log.Printf("ws: failed to write message: %v", err)
				return
			}

		case <-ticker.C:
			// Send ping to keep connection alive
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("ws: failed to send ping: %v", err)
				return
			}
			log.Printf("ws: ping sent to instance: %s", c.InstanceID)
		}
	}
}

// ReadPump optional: read loop from client.
// For the initial version, you can just consume and discard,
// or use it to receive subscribe commands, etc.
// If not needed yet, can be kept minimal / empty.
func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister(c)
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(512)

	_ = c.conn.SetReadDeadline(time.Now().Add(15 * time.Minute))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(15 * time.Minute))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("ws read error: %v", err)
			break
		}
	}
}

// BroadcastToInstance sends a message to clients listening to a specific instance
func (h *Hub) BroadcastToInstance(instanceID string, data map[string]interface{}) {
	event := WsEvent{
		Event:     "incoming_message",
		Timestamp: time.Now(),
		Data:      data,
	}

	// Add RLock to prevent race condition
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.InstanceID == instanceID {
			select {
			case client.send <- event:
				// Successfully sent event to client
			default:
				// Don't delete here to avoid modifying map during iteration
				// Let Hub.Run() handle cleanup of problematic clients
				log.Printf("⚠️ Client buffer full for instance: %s", instanceID)
			}
		}
	}
}
