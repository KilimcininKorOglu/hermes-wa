// internal/handler/user_auth.go
package handler

import (
	"database/sql"
	"log"
	"net/http"

	"charon/internal/helper"
	"charon/internal/model"
	"charon/internal/service"

	"github.com/labstack/echo/v4"
)

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User model.UserResponse `json:"user"`
}

// LoginUser handles user login with username/password
// POST /login
func LoginUser(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", "BAD_REQUEST", err.Error())
	}

	// Validate required fields
	if req.Username == "" || req.Password == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username and password are required", "MISSING_FIELDS", "")
	}

	// Check account lockout before authentication — return the SAME generic
	// response as a credential failure so attackers cannot distinguish account
	// states (existence, lockout, disabled, etc.).
	userID, lookupErr := model.GetUserIDByUsername(req.Username)
	if lookupErr == nil {
		if locked, _ := model.IsAccountLocked(userID); locked {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid username or password", "INVALID_CREDENTIALS", "account locked")
		}
	}

	// Authenticate user
	user, err := service.AuthenticateUser(req.Username, req.Password)
	if err != nil {
		if err == model.ErrInvalidCredentials {
			if lookupErr == nil {
				_ = model.IncrementFailedLogin(userID)
			}
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid username or password", "INVALID_CREDENTIALS", "")
		}
		// Any other authentication error (disabled user, DB failure, etc.) must
		// NOT leak details to the client. Log server-side only.
		return ErrorResponse(c, http.StatusUnauthorized, "Invalid username or password", "INVALID_CREDENTIALS", err.Error())
	}

	// Reset failed login counter on successful login
	_ = model.ResetFailedLogin(int(user.ID))

	// Create session
	ipAddress := c.RealIP()
	userAgent := c.Request().UserAgent()
	rawToken, err := service.CreateUserSession(user, ipAddress, userAgent)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create session", "SESSION_CREATION_FAILED", err.Error())
	}
	setSessionCookie(c, rawToken, service.GetSessionExpiry())

	// Log login
	err = model.LogAction(&model.AuditLog{
		UserID:       sql.NullInt64{Int64: user.ID, Valid: true},
		Action:       "user.login",
		ResourceType: sql.NullString{String: "user", Valid: true},
		ResourceID:   sql.NullString{String: user.Username, Valid: true},
		IPAddress:    sql.NullString{String: ipAddress, Valid: true},
		UserAgent:    sql.NullString{String: userAgent, Valid: true},
	})
	if err != nil {
		log.Printf("⚠️ Failed to log audit: %v", err)
	}

	return SuccessResponse(c, http.StatusOK, "Login successful", AuthResponse{
		User: user.ToResponse(),
	})
}

// LogoutUser handles user logout by destroying the session
// POST /logout (public route — no middleware, reads cookie directly)
func LogoutUser(c echo.Context) error {
	// Read session cookie, validate for audit logging, then destroy
	cookie, err := c.Cookie("session")
	if err == nil && cookie.Value != "" {
		// Attempt to read session for audit before destroying
		session, validateErr := model.GetAuthSessionByToken(cookie.Value)
		if validateErr == nil && session != nil {
			_ = model.LogAction(&model.AuditLog{
				UserID:       sql.NullInt64{Int64: session.UserID, Valid: true},
				Action:       "user.logout",
				ResourceType: sql.NullString{String: "user", Valid: true},
				ResourceID:   sql.NullString{String: session.Username, Valid: true},
				IPAddress:    sql.NullString{String: c.RealIP(), Valid: true},
				UserAgent:    sql.NullString{String: c.Request().UserAgent(), Valid: true},
			})
		}

		if destroyErr := service.DestroySession(cookie.Value); destroyErr != nil {
			log.Printf("⚠️ Failed to destroy session: %v", destroyErr)
		}
	}
	clearSessionCookie(c)

	return SuccessResponse(c, http.StatusOK, "Logged out successfully", nil)
}

// GetCurrentUser returns the current authenticated user's profile
// GET /api/me
func GetCurrentUser(c echo.Context) error {
	// Get user from context (set by session middleware)
	userClaims, ok := c.Get("user_claims").(*service.Claims)
	if !ok {
		return ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "UNAUTHORIZED", "")
	}

	// Get full user details
	user, err := model.GetUserByID(userClaims.UserID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "User not found", "USER_NOT_FOUND", err.Error())
	}

	return SuccessResponse(c, http.StatusOK, "User profile retrieved", user.ToResponse())
}

// UpdateCurrentUser updates the current user's profile
// PUT /api/me
func UpdateCurrentUser(c echo.Context) error {
	userClaims, ok := c.Get("user_claims").(*service.Claims)
	if !ok {
		return ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "UNAUTHORIZED", "")
	}

	var req model.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", "BAD_REQUEST", err.Error())
	}

	// Get current user
	user, err := model.GetUserByID(userClaims.UserID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "User not found", "USER_NOT_FOUND", err.Error())
	}

	// Update fields if provided
	if req.FullName != nil {
		user.FullName = sql.NullString{String: *req.FullName, Valid: true}
	}
	if req.AvatarURL != nil {
		user.AvatarURL = sql.NullString{String: *req.AvatarURL, Valid: true}
	}

	err = model.UpdateUser(user)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update user", "UPDATE_FAILED", err.Error())
	}

	// Log update
	_ = model.LogAction(&model.AuditLog{
		UserID:       sql.NullInt64{Int64: user.ID, Valid: true},
		Action:       "user.update",
		ResourceType: sql.NullString{String: "user", Valid: true},
		ResourceID:   sql.NullString{String: user.Username, Valid: true},
		IPAddress:    sql.NullString{String: c.RealIP(), Valid: true},
		UserAgent:    sql.NullString{String: c.Request().UserAgent(), Valid: true},
	})

	return SuccessResponse(c, http.StatusOK, "User profile updated successfully", user.ToResponse())
}

// ChangePassword handles password change for local auth users
// PUT /api/me/password
func ChangePassword(c echo.Context) error {
	userClaims, ok := c.Get("user_claims").(*service.Claims)
	if !ok {
		return ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "UNAUTHORIZED", "")
	}

	var req model.ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", "BAD_REQUEST", err.Error())
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Old password and new password are required", "MISSING_FIELDS", "")
	}

	// Get user
	user, err := model.GetUserByID(userClaims.UserID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "User not found", "USER_NOT_FOUND", err.Error())
	}

	// Check if user is local auth
	if user.AuthProvider != "local" {
		return ErrorResponse(c, http.StatusBadRequest, "Cannot change password for OAuth users", "OAUTH_USER", "")
	}

	// Verify old password
	if !user.PasswordHash.Valid {
		return ErrorResponse(c, http.StatusBadRequest, "Password not set", "NO_PASSWORD", "")
	}

	// Authenticate with old password
	_, err = service.AuthenticateUser(user.Username, req.OldPassword)
	if err != nil {
		return ErrorResponse(c, http.StatusUnauthorized, "Invalid old password", "INVALID_OLD_PASSWORD", "")
	}

	// Hash new password
	newPasswordHash, err := helper.HashPassword(req.NewPassword)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password", "HASH_FAILED", err.Error())
	}

	// Update password
	err = model.UpdateUserPassword(user.ID, newPasswordHash)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update password", "UPDATE_FAILED", err.Error())
	}

	// Destroy all sessions for security
	err = service.DestroyAllUserSessions(user.ID)
	if err != nil {
		log.Printf("❌ ERROR: Failed to destroy sessions: %v", err)
	} else {
		log.Printf("✅ SUCCESS: All sessions destroyed for user ID: %d", user.ID)
	}
	clearSessionCookie(c)

	// Log password change
	err = model.LogAction(&model.AuditLog{
		UserID:       sql.NullInt64{Int64: user.ID, Valid: true},
		Action:       "user.password_change",
		ResourceType: sql.NullString{String: "user", Valid: true},
		ResourceID:   sql.NullString{String: user.Username, Valid: true},
		IPAddress:    sql.NullString{String: c.RealIP(), Valid: true},
		UserAgent:    sql.NullString{String: c.Request().UserAgent(), Valid: true},
	})
	if err != nil {
		log.Printf("⚠️ Failed to log password change audit: %v", err)
	}

	return SuccessResponse(c, http.StatusOK, "Password changed successfully. Please login again.", nil)
}
