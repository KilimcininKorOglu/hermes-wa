package handler

import (
	"net/http"
	"time"

	"charon/config"

	"github.com/labstack/echo/v4"
)

func setSessionCookie(c echo.Context, rawToken string, maxAge time.Duration) {
	cookie := &http.Cookie{
		Name:     "session",
		Value:    rawToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   config.CookieSecure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(maxAge.Seconds()),
	}
	c.SetCookie(cookie)
}

func clearSessionCookie(c echo.Context) {
	cookie := &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   config.CookieSecure,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	}
	c.SetCookie(cookie)
}
