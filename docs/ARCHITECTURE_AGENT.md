# Agent-Ready Architecture (Concise)

Minimal stack optimized for agentic development, fast iteration, and low operational overhead.

## Services
- frontend (React + Vite, dev only)
- backend (Node.js + Express + Socket.IO)
- db (PostgreSQL 15)
- n8n (workflow automation)

## Networking (Tailscale)
- Frontend: http://100.120.219.68:3000
- Backend API: http://100.120.219.68:3001/api (Socket.IO on same origin)
- Capcom6 (Local Server): http://100.126.232.47:8080
- n8n: http://100.120.219.68:5678

## Principles
- Keep state in named Docker volumes; bind mounts only for frontend HMR.
- Prefer simple REST + WebSockets over extra gateways.
- Health checks for all user-facing services.
- One source of truth for environment: `.env`.

## Compose (Summary)
- `frontend` depends on healthy `backend`.
- `backend` depends on healthy `db`.
- `db` loads schema from `backend/db/init`.
- `n8n` uses same `db` (separate schema).

## Common Flows
- Health: `GET /api/health`.
- Auth: `POST /api/auth/login`, then Bearer token.
- SMS Outbound: Backend → Capcom6 `/message`.
- SMS Inbound: Capcom6 → Backend `POST /api/webhooks/capcom6`.

## Agent Workflow (Short)
- Start: `docker compose up -d`
- Check: `docker compose ps` → green; `curl http://localhost:3001/api/health`
- Logs: `docker compose logs -f backend`
- DB: `docker compose exec db psql -U postgres -d pharmacy`

## Avoid Bloat
- No API gateways, no serverless functions.
- No duplicated health endpoints or overlapping services.
- Only add components that reduce agent friction.
