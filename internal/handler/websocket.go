package handler

import (
	"log"
	"net/http"

	"hermeswa/internal/ws"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

// Gorilla WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: production: restrict origin
		return true
	},
}

// WebSocketHandler handles WS connections on the /ws route
func WebSocketHandler(hub *ws.Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			log.Printf("ws upgrade error: %v", err)
			return err
		}

		client := ws.NewClient(hub, conn)
		hub.Register(client)

		go client.WritePump()
		go client.ReadPump()

		return nil
	}
}
