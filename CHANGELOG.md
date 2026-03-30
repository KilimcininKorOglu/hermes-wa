# Changelog

## [1.1.0] - 2026-03-30

### Added
- By-phone-number message sending mode with toggle in Messages page
- Group listing in phone mode via GET /api/groups/by-number endpoint
- Script edit side panel in warming page (title, description, category)
- Room edit side panel with full AI configuration support
- Template edit side panel with JSON structure editing
- Warming log detail side panel with full message and error info
- Per-instance status refresh button in instance detail panel
- Blast config edit side panel with webhook URL/secret
- Standalone Contacts page with paginated table, detail panel, mutual groups, XLSX/CSV export
- Instance detail panel with edit form, device info, and webhook config
- Messages page rewrite with contacts/groups tabs, media send (file+URL), group messaging, number check
- Warming system wizard (3-step room create), inline script lines (add/edit/delete/AI gen/reorder), templates tab
- Auto-seed admin user (admin/admin123) on startup if none exists

### Fixed
- API response parsing for instances, warming rooms, and scripts (nested objects not flat arrays)
- Blast outbox interval field name (interval_seconds not interval_min_seconds)
- Vite proxy bypass for GET /login route conflict with SPA
- Docker web dev port changed to 5174 to avoid conflict
- Docker Vite proxy target uses service name (api:2121) not localhost
- Docker init-db.sql made idempotent with pg_database check
- Healthchecks added to all Docker containers

### Changed
- WarmingRoom type extended with AI and reply delay fields
- npm dependencies updated

## [1.0.0] - 2026-03-30

### Added
- WhatsApp multi-instance automation REST API (Go + Echo v4 + whatsmeow)
- JWT authentication with access/refresh tokens
- WebSocket real-time events (QR, status changes, incoming messages)
- WhatsApp warming system with BOT_VS_BOT and HUMAN_VS_BOT modes
- Google Gemini AI integration for warming conversations
- Standalone outbox worker for blast messaging with atomic claiming
- Admin API endpoints for user management and instance assignment
- File manager API for uploads directory browsing and deletion
- Dashboard stats API for system-wide metrics
- React 19 web UI with cyberpunk dark theme (TailwindCSS v4)
- Login/Register pages with JWT auth flow
- Dashboard with live WebSocket event feed and admin stats
- Instance management with real-time QR code scanning
- Chat-like messaging UI with per-instance WebSocket listeners
- File manager with breadcrumbs, preview panel, and admin delete
- Warming system UI (rooms, scripts, logs) with play/pause/stop controls
- Blast outbox worker config management with circle/app selectors
- Admin user management with role change and instance assignment
- Profile page with avatar upload and password change
- System identity settings with company info and logo uploads
- Docker development environment (PostgreSQL + API + Worker + Web)
- Production Dockerfile with 3-stage build (Node + Go + Debian runtime)
- SPA static serve from Go binary (web/dist catch-all)
- Cross-platform build support via zig CC and goreleaser-cross

### Changed
- Replaced chai2010/webp (abandoned) with vegidio/webp-go (active, bundled static libs)
- Removed MySQL support, PostgreSQL-only for all databases
- Adapted build tooling from btk-sorgu to hermeswa project
- Docker volumes use docker-data/ bind mounts instead of named volumes
- README rewritten with professional emoji-free design
