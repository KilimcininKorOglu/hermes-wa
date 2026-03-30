package handler

import (
	"log"
	"net/http"
	"os"
	"strings"

	"hermeswa/internal/service"
	"hermeswa/internal/ws"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

// Gorilla WebSocket upgrader with origin validation
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true // Non-browser clients (curl, Postman)
		}
		allowedOrigins := os.Getenv("CORS_ALLOW_ORIGINS")
		if allowedOrigins == "" {
			return false
		}
		for _, o := range strings.Split(allowedOrigins, ",") {
			if strings.TrimSpace(o) == origin {
				return true
			}
		}
		return false
	},
}

// WebSocketHandler handles WS connections on the /ws route with JWT auth
func WebSocketHandler(hub *ws.Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Require JWT token via query parameter
		token := c.QueryParam("token")
		if token == "" {
			return c.JSON(http.StatusUnauthorized, map[string]interface{}{
				"success": false,
				"message": "Authentication required. Provide token as query parameter.",
			})
		}

		_, err := service.ValidateAccessToken(token)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]interface{}{
				"success": false,
				"message": "Invalid or expired token",
			})
		}

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
