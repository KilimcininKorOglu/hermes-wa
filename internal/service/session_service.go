package service

import (
	"os"
	"time"

	"charon/internal/model"
)

var sessionExpiry = 168 * time.Hour // 7 days default

// InitSessionConfig reads session configuration from environment
func InitSessionConfig() {
	if v := os.Getenv("SESSION_EXPIRY"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			sessionExpiry = d
		}
	}
}

// CreateUserSession creates a new session for a user
func CreateUserSession(user *model.User, ipAddress, userAgent string) (string, error) {
	return model.CreateAuthSession(user.ID, user.Username, user.Role, ipAddress, userAgent, sessionExpiry)
}

// ValidateSession validates a raw session token
func ValidateSession(rawToken string) (*model.AuthSession, error) {
	return model.GetAuthSessionByToken(rawToken)
}

// DestroySession removes a single session
func DestroySession(rawToken string) error {
	return model.DeleteAuthSession(rawToken)
}

// DestroyAllUserSessions removes all sessions for a user
func DestroyAllUserSessions(userID int64) error {
	return model.DeleteAllUserAuthSessions(userID)
}

// GetSessionExpiry returns the configured session expiry duration
func GetSessionExpiry() time.Duration {
	return sessionExpiry
}
