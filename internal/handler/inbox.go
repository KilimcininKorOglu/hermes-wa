package handler

import (
	"hermeswa/internal/service"
	"hermeswa/internal/ws"
	"log"

	"github.com/labstack/echo/v4"
)

// GET /listen/:instanceId - WebSocket endpoint to listen for incoming messages
func ListenMessages(hub *ws.Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		instanceID := c.Param("instanceId")

		// Validate instanceID
		if instanceID == "" {
			return ErrorResponse(c, 400, "instanceId is required", "VALIDATION_ERROR", "")
		}

		// Validate session exists and is connected
		session, err := service.GetSession(instanceID)
		if err != nil {
			return ErrorResponse(c, 404, "Session not found", "SESSION_NOT_FOUND", "Please login first")
		}

		if !session.IsConnected {
			return ErrorResponse(c, 400, "Session is not connected", "NOT_CONNECTED", "Please check /status endpoint")
		}

		if !session.Client.IsConnected() {
			return ErrorResponse(c, 400, "WhatsApp connection lost", "CONNECTION_LOST", "Please reconnect")
		}

		if session.Client.Store.ID == nil {
			return ErrorResponse(c, 400, "Not logged in", "NOT_LOGGED_IN", "Please scan QR code first")
		}

		// Upgrade to WebSocket
		conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			return ErrorResponse(c, 500, "Failed to upgrade WebSocket", "UPGRADE_FAILED", err.Error())
		}

		// Create client and register
		client := ws.NewClient(hub, conn)
		client.InstanceID = instanceID

		hub.Register(client)

		log.Printf("Client connected to listen instance: %s", instanceID)

		// Run pumps
		go client.WritePump()
		go client.ReadPump()

		return nil
	}
}
