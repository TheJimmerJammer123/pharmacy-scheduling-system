# Cursor & Claude Code Setup Notes

This repo is optimized for agent development. Use this checklist to reduce friction.

## Recommended Extensions / Settings
- Cursor or VSCode with:
  - Docker, YAML, ESLint, Prettier
  - REST Client or Thunder Client (optional)
- Terminal default shell: bash
- Node >= 18 (host optional; containers handle runtime)

## File Navigation Hints
- Docs hub: `docs/README.md`
- Agent handbook: `docs/AGENTS_GUIDE.md`
- Agent-oriented architecture: `docs/ARCHITECTURE_AGENT.md`
- Agent docs index: `.claude/agents/README.md`
- Compose & services: `docker-compose.yml`

## Common Flows
- Start: `make up`
- Check: `make ps` and `make health`
- Logs: `make logs-backend`
- DB shell: `make db-shell`
- SMS status: `make sms-status`

## Environment
- Copy `.env.example` → `.env` and fill values.
- Key SMS env: `CAPCOM6_API_URL=http://100.126.232.47:8080`, `CAPCOM6_USERNAME`, `CAPCOM6_PASSWORD`.

## Troubleshooting
- If backend restarts: `docker compose logs backend --tail=100`
- If DB init fails: `docker compose logs db --tail=100`
- Rebuild backend image after code edits: `make build-backend && make restart-backend`

## Guardrails
- Do not run long-lived dev servers outside Docker.
- Use Tailscale IPs for testing on peer/mobile.
- Keep docs updated as endpoints change.
