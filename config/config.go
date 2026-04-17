package config

var EnableWebsocketIncomingMessage bool
var EnableWebhook bool
var WarmingWorkerEnabled bool
var WarmingAutoReplyEnabled bool
var WarmingAutoReplyCooldown int // seconds

// CookieSecure drives the Secure flag on the session cookie. Populated once
// from the COOKIE_SECURE env var at startup so hot-path handlers don't shell
// out to os.Getenv on every request.
var CookieSecure bool

// Typing Delay Configuration (read once at startup)
var TypingDelayMin int // 0 = disabled (use calculated delay)
var TypingDelayMax int

// Phone Number Configuration
var PhoneCountryCode string // e.g. "90" for Turkey, "62" for Indonesia, "" = no restriction (E.164 required)

// AI Configuration
var AIEnabled bool
var AIDefaultProvider string
var GeminiAPIKey string
var GeminiDefaultModel string
var AIConversationHistoryLimit int
var AIDefaultTemperature float64
var AIDefaultMaxTokens int
