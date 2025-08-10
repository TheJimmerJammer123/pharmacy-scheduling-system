# Agent Handbook

This project is developed exclusively by agents (Cursor/Claude Code). This guide consolidates global rules, environment details, and copy-paste workflows to ensure fast, correct execution.

## Golden Rules
- Use Docker Compose for all service control. Do not run long-lived dev processes directly.
- Prefer Tailscale IPs when testing from peer/mobile devices:
  - Frontend: http://100.120.219.68:3000
  - Backend API: http://100.120.219.68:3001 (Socket.IO on same host/port)
  - Capcom6 SMS Gateway (Local Server mode): http://100.126.232.47:8080
  - n8n: http://100.120.219.68:5678
- Architecture: Node.js + Express + Socket.IO + PostgreSQL. No Supabase/Kong in this architecture.
- Use named Docker volumes for persistence; bind mounts only for frontend HMR.
- After edits that could affect runtime, run basic health checks (see below).

## Service Control (copy/paste)
```bash
# Start all services
docker compose up -d

# Status & health
docker compose ps

# Logs
docker compose logs -f backend

# Restart a service
docker compose restart backend
```

## Health Checks (copy/paste)
```bash
# Backend health
curl -sSf http://localhost:3001/api/health | jq || curl -sSf http://100.120.219.68:3001/api/health | jq

# DB connectivity (inside container)
docker compose exec db psql -U postgres -d pharmacy -c "SELECT NOW(), version();"

# Capcom6 gateway status
curl -sSf http://100.126.232.47:8080/status || curl -sSf http://100.126.232.47:8080/state
```

## Auth & Testing (copy/paste)
```bash
# Login (get JWT)
TOKEN=$(curl -sSf -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# Use token for an authenticated request
curl -sSf http://localhost:3001/api/contacts -H "Authorization: Bearer $TOKEN" | jq
```

## SMS Testing (copy/paste)
```bash
# Send SMS via backend → Capcom6
curl -sSf -X POST http://localhost:3001/api/send-sms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","message":"Hello from Pharmacy","contactId":null}' | jq

## AI Testing (copy/paste)
```bash
# Quick chat (uses mock mode if no API key)
make ai-chat m="Summarize today"

# Or raw curl
TOKEN=$(curl -sSf -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | jq -r .token)
curl -sSf -X POST http://localhost:3001/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"message":"Hello"}' | jq
```

# Webhook (Capcom6 → backend) test payload example
curl -sSf -X POST http://localhost:3001/api/webhooks/capcom6 \
  -H 'Content-Type: application/json' \
  -d '{"message_id":"cap_test","status":"delivered","to":"+15551234567","timestamp":"2025-08-10T14:31:00Z"}' | jq
```

## Environment Variables
See `env.example` and `docs/env.md`. Key values for SMS:
- `CAPCOM6_API_URL=http://100.126.232.47:8080`
- `CAPCOM6_USERNAME=sms`
- `CAPCOM6_PASSWORD=...`
- `CAPCOM6_PHONE_NUMBER=+1...` (optional)

## Common Gotchas
- Index predicates cannot use volatile functions (e.g., `CURRENT_DATE`) in PostgreSQL.
- Ensure `JWT_SECRET` is set; backend fails early if missing.
- When testing from non-host devices, avoid `localhost`; use Tailscale IPs.

## Agent-Specific Pointers
- Frontend: Use `VITE_BACKEND_URL` and `VITE_SOCKET_URL` pointing to `http://100.120.219.68:3001` for mobile/peer testing.
- Automation (n8n): Use internal hostname `backend:3001` for HTTP nodes within Docker.
- Security: Never commit secrets; scan built assets before sharing.

## Useful File Map
- Compose: `docker-compose.yml`
- Backend: `backend/`
- DB init: `backend/db/init/`
- Frontend: `frontend/`
- Agent docs: `.claude/agents/`
- API docs: `docs/api/`
- SMS: `docs/SMS_INTEGRATION.md`

## PR & Commit Etiquette
- Small, focused edits; update docs when behavior changes.
- Run health checks post-change; include expected outputs in PR body.
- Use conventional commits (feat/fix/docs/refactor/test/chore).
