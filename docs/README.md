# Documentation Index

Use this index to navigate all project docs quickly in Cursor or Claude Code.

## Start Here
- Project Overview: ../README.md
- Architecture Plan: ../ARCHITECTURE_PLAN.md
- Agent-Ready Architecture: ARCHITECTURE_AGENT.md
- API Documentation: api/API_DOCUMENTATION.md

## Architecture
- High-level Architecture: ../ARCHITECTURE_PLAN.md
- Document Ingestion System: architecture/DOCUMENT_INGESTION_SYSTEM.md
- Realtime (Socket.IO) Events: see API docs events section

## Backend (Node.js + Express)
- Environment Variables: ../env.example
- Service Health: GET /api/health
- Auth Endpoints: see API docs (Authentication)
- SMS Integration: ./SMS_INTEGRATION.md

## Frontend (React + Vite + TS)
- Dev server and configuration: ../frontend/README.md
- API client: ../frontend/src/services/apiService.ts
- Socket client: ../frontend/src/services/socketService.ts

## Database (PostgreSQL)
- Schema initialization: ../backend/db/init
- Core tables: see API docs (Database Schema)

## Workflows & Automation
- n8n platform: docker-compose.yml service and environment
- Webhooks: SMS inbound webhook `/api/webhooks/capcom6` (Backend)

## Data Operations
 - Excel Import Guide: EXCEL_IMPORT_GUIDE.md
 - Environment reference: env.md

## Environment & Operations
- Agent Handbook: AGENTS_GUIDE.md

## Deployment & Operations
- Local development: ../start-new-architecture.sh
- Compose services: ../docker-compose.yml
- Deployment notes: deployment/README.md

## Contributing & Processes
- Project coordination and guidelines: ../CLAUDE.md

## Scripts
- Data import: ../scripts/data-processing/import-complete-dataset.js
- Utilities: ../scripts/utilities/

## Quick Links
- Root README: ../README.md
- Architecture Plan: ../ARCHITECTURE_PLAN.md
- API Docs: api/API_DOCUMENTATION.md
- Cursor/Claude setup: CURSOR_CLAUDE_SETUP.md

## Base URLs (Development)
- Frontend: http://100.120.219.68:3000
- Backend API: http://100.120.219.68:3001/api
- Socket.IO: http://100.120.219.68:3001
- Capcom6 (Local Server): http://100.126.232.47:8080
- n8n: http://100.120.219.68:5678

## Agent Docs (for Claude Code / Cursor)
- Agents index: ../.claude/agents/README.md
- Frontend developer: ../.claude/agents/pharmacy-frontend-developer.md
- Database administrator: ../.claude/agents/pharmacy-database-administrator.md
- Docker orchestration specialist: ../.claude/agents/pharmacy-docker-orchestration-specialist.md
- SMS integration specialist: ../.claude/agents/pharmacy-sms-integration-specialist.md
- AI chatbot developer: ../.claude/agents/pharmacy-ai-chatbot-developer.md
- Document processing specialist: ../.claude/agents/pharmacy-document-processing-specialist.md
- Security & authentication specialist: ../.claude/agents/pharmacy-security-authentication-specialist.md
- n8n automation specialist: ../.claude/agents/pharmacy-n8n-automation-specialist.md
