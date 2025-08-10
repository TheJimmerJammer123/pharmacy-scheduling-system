# 🏥 PHARMACY SCHEDULING SYSTEM - Claude Code Project (Updated for Node.js Backend)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 **PROJECT OVERVIEW**

### **Core Purpose**
A modern, AI-powered pharmacy scheduling and communication system that provides:
- **Employee Management**: Complete employee information and profile management
- **Schedule Management**: Multi-store scheduling with historical data tracking
- **SMS Communication**: Direct messaging with employees via Capcom6 gateway
- **AI Analytics**: Intelligent chatbot with comprehensive data access and query capabilities
- **Document Ingestion**: Advanced multi-format document processing (Excel, PDF, CSV)

### **Technical Stack**
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + Socket.IO (PostgreSQL, JWT Auth, Real-time)
- **AI Integration**: OpenRouter API with Qwen3 Coder model
- **Workflow Automation**: Self-hosted n8n for automation and integrations
- **SMS Gateway**: Capcom6 Android SMS Gateway via Tailscale network
- **Document Processing**: Advanced multi-format ingestion (Excel, PDF, CSV)
- **Containerization**: Docker with unified docker-compose.yml
- **Version Control**: Git with GitHub for change tracking and rollback capability

### Agent Quick Links (Cursor / Claude Code)
- Docs hub: `docs/README.md`
- Agent Handbook: `docs/AGENTS_GUIDE.md`
- Agent Architecture: `docs/ARCHITECTURE_AGENT.md`
- Setup notes: `docs/CURSOR_CLAUDE_SETUP.md`
- Makefile targets: `make up`, `make health`, `make smoke`, `make ai-chat m="Hello"`
- API docs: `docs/api/API_DOCUMENTATION.md` (Postman: `docs/api/POSTMAN_COLLECTION.json`)

## ⚠️ **CRITICAL MCP SERVER USAGE**

### **🔧 Context7 MCP Server - PRIMARY TROUBLESHOOTING TOOL**
**ALWAYS use the context7 MCP server when troubleshooting ANY issue in this project**. Context7 is incredibly useful for solving most of our issues including:

- **Backend Setup Issues**: Research Node.js + Express documentation and troubleshooting guides
- **API Key & Authentication Problems**: JWT token generation, API key validation, authentication troubleshooting
- **Docker Container Issues**: Docker Compose configurations, container optimization, service requirements
- **Library Integration Problems**: Up-to-date documentation and code examples for any library or framework
- **Configuration Errors**: Proper configuration patterns and troubleshooting steps
- **Database Schema Issues**: PostgreSQL-specific solutions and best practices
- **Frontend Framework Problems**: React, TypeScript, Vite, and Tailwind CSS troubleshooting guidance
- **SMS Gateway Integration**: Capcom6 API documentation and integration patterns

**How to use context7 effectively:**
1. **Before implementing any solution**, use context7 to research the problem and gather relevant documentation
2. **When encountering errors**, use context7 to look up error messages and troubleshooting steps
3. **For configuration changes**, use context7 to verify proper patterns and best practices
4. **When integrating new libraries**, use context7 to get the latest documentation and examples

### **🤖 n8n Workflow Development**
**ALWAYS use the n8n-mcp server** when working with n8n workflows, automation, or any n8n-related tasks.

## 🎭 **SPECIALIZED SUBAGENTS**

This project uses 9 specialized subagents for different aspects of development. **Use the Task tool with the appropriate subagent type for specialized work:**

### **Primary Coordinator**
- **`pharmacy-workflow-orchestrator`**: Complex multi-step tasks, GitHub Actions CI/CD, emergency rollbacks, project coordination

### **Core Development**
- **`pharmacy-frontend-developer`**: React, TypeScript, Tailwind CSS, Backend API integration
- **`pharmacy-database-administrator`**: PostgreSQL, database schema, API endpoints, performance tuning
- **`pharmacy-docker-orchestration-specialist`**: Docker Compose, container management, service orchestration, development commands

### **Integration Specialists**
- **`pharmacy-sms-integration-specialist`**: Capcom6 SMS gateway, webhook processing, employee communication
- **`pharmacy-ai-chatbot-developer`**: OpenRouter integration, Qwen3 Coder model, natural language processing
- **`pharmacy-n8n-automation-specialist`**: n8n workflow automation, system integration, bulk operations
- **`pharmacy-document-processing-specialist`**: Excel/PDF processing, file upload handling, data transformation

### **Security & Quality**
- **`pharmacy-security-authentication-specialist`**: JWT configuration, RLS policies, HIPAA compliance, audit logging
- **`pharmacy-api-management-specialist`**: API endpoint management, webhook configuration, authentication troubleshooting, integration testing

## 🚀 **QUICK START**

### **Development Environment**
```bash
# Start all services
docker compose up -d

# Check services are healthy
docker compose ps

# Test API endpoints (Node.js backend)
source .env
curl -H "Authorization: Bearer $(jq -r .token <<< $(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}'))" \
     http://localhost:3001/api/health

# Access Points:
# Frontend: http://100.120.219.68:3000
# n8n Automation: http://100.120.219.68:5678
```

## 🔧 **DATABASE SETUP (PostgreSQL only)**

1. Database initializes from `backend/db/init` via Docker on first run.
2. No Supabase roles or services are used.
3. To re-run initialization:
   - `docker compose down -v`
   - `docker compose up -d db`
   - Verify: `docker compose exec db psql -U postgres -d pharmacy -c "\dt"`

### **Verification Steps**
After initialization:
1. **Restart services**: `docker compose down && docker compose up -d`
2. **Check health**: `docker compose ps` - all services should be healthy
3. **Test backend health**: `curl -s http://localhost:3001/api/health | jq`

### **Notes**
- No Supabase services are used in this architecture

### Dockerized Frontend + HMR
- The frontend runs in Docker with hot reload (HMR) enabled.
- Control via docker compose, not npm:
  - Start: `docker compose up -d frontend`
  - Logs: `docker compose logs -f frontend`
  - Restart: `docker compose restart frontend`
- HMR uses polling intentionally:
  - `CHOKIDAR_USEPOLLING=true`
  - `WATCHPACK_POLLING=true`

-### Tailscale Access (Frontend, API, Capcom6)
- Server (Tailscale): 100.120.219.68
- Capcom6 (Android/Tailscale) — Local Server mode: 100.126.232.47:8080
- Access URLs from peer/mobile devices:
  - Frontend: http://100.120.219.68:3000
  - API: http://100.120.219.68:3001
  - Capcom6: http://100.126.232.47:8080
- Do not use localhost when on mobile or other devices.

### Volumes Over Bind Mounts — Policy
- Default: use named Docker volumes for persistent data/state (e.g., db-config, n8n_data).
- Bind mounts: dev-only for frontend code hot reload (clearly development-only).
- Config files: prefer COPY into images or read-only mounts; avoid writable bind mounts.
- Useful commands:
  - `docker volume ls`
  - `docker volume inspect <name>`

### Backend — Concise Working Commands
Copy-paste ready, assuming .env is loaded.

- Load env:
  - `source .env`
- REST test (health):
  - `curl -sSf http://100.120.219.68:3001/api/health | jq`
- Auth test (login):
  - `curl -sSf -X POST http://100.120.219.68:3001/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}' | jq`

### Agent Guardrails (short list)
- Do not run npm restart/npm run dev for frontend; use docker compose commands.
- Use Tailscale IPs (100.120.219.68, 100.126.232.47) instead of localhost when on peer/mobile.
- Prefer volumes for state; bind mounts only for dev HMR.
- Before sharing a build: `grep -R "SERVICE_ROLE_KEY" -n [frontend/dist](frontend/dist:1) || true`

> Related files: [docker-compose.yml](docker-compose.yml:1), [README.md](README.md:1), [frontend/Dockerfile](frontend/Dockerfile:1), [frontend/Dockerfile.dev](frontend/Dockerfile.dev:1)

### **Git Workflow**
```bash
# Daily development
git status && git log --oneline -5
git checkout -b feature/your-feature
git add . && git commit -m "feat: description"
git push origin feature/your-feature

# Emergency rollback
git revert HEAD                           # Safe revert
git reset --hard stable-20250805-113741  # Emergency reset to stable state
```

## 🤖 **GITHUB ACTIONS CI/CD PIPELINE**

### **Automated Workflows**
- **CI/CD Pipeline**: Comprehensive testing, security scanning, Docker integration
- **Emergency Rollback**: Manual trigger for immediate rollbacks with safety checks
- **Production Deployment**: Staging validation followed by blue-green production deployment

### **Emergency Rollback**
```bash
# Via GitHub Actions UI:
# 1. Go to Actions → Emergency Rollback & Recovery
# 2. Specify:
#    - Rollback Target: stable-20250805-113741
#    - Emergency Level: critical
#    - Reason: [describe the issue]
```

### **Quality Gates**
All pull requests to `main` must pass:
- ✅ Quality Gates & Security Checks
- ✅ Frontend Tests & Build
- ✅ Docker Integration Tests
- ✅ Security & Dependency Audit

## 📊 **SYSTEM STATUS**

### **Current System Status** ✅ FULLY OPERATIONAL (4/4 Services)
- ✅ **Docker Services**: 8/9 services healthy and operational
- ✅ **Database Schema**: Complete pharmacy schema with sample data
- ✅ **REST API Endpoints**: All endpoints operational with authentication via Tailscale
- ✅ **Frontend**: React app with hot reload on http://100.120.219.68:3000
- ✅ **SMS Integration**: Complete two-way SMS communication via Capcom6
- ✅ **AI Assistant**: OpenRouter integration with GPT-3.5-turbo model
- ✅ **Workflow Automation**: n8n platform operational at http://100.120.219.68:5678
- ✅ **Backend API**: Node.js + Express running at http://100.120.219.68:3001
- ✅ **Socket.IO**: Real-time events operational
- ✅ **GitHub Actions**: CI/CD pipeline with emergency rollback capabilities

### **Minor Service Issues** (1 service has configuration issues)
- ⚠️ **Auth Service**: Database function permissions issue (JWT auth working via API keys)

### **Repository Details**
- **GitHub Repository**: https://github.com/TheJimmerJammer123/pharmacy-scheduling-system
- **Private Repository**: Secure storage with proper authentication
- **Stable Checkpoint**: `stable-20250805-113741` (for emergency rollbacks)

## 🔄 **DEVELOPMENT WORKFLOW**

### **Feature Development Process**
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Use Specialized Subagents**: Delegate work via Task tool to appropriate subagents
3. **Test Locally**: Use `docker compose up -d` for testing
4. **Create Pull Request**: GitHub Actions runs automated testing
5. **Code Review**: Required before merge to main
6. **Deploy**: Staging validation followed by production release

### **Emergency Procedures**
1. **Immediate Rollback**: Use GitHub Actions Emergency Rollback workflow
2. **Manual Rollback**: `git reset --hard stable-20250805-113741`
3. **Service Recovery**: `docker compose restart <service>`
4. **Full System Reset**: `docker compose down && docker compose up -d`
5. **Database Schema Recovery**: 
   ```bash
   docker compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/migrations/01-pharmacy_schema.sql
   docker compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/migrations/02-document_imports.sql
   ```
6. **Problematic Services**: Check backend logs: `docker compose logs -f backend`

## 📋 **BEST PRACTICES**

### **Development Principles**
- **Context7 First**: Always research with context7 before implementing solutions
- **Specialized Delegation**: Use appropriate subagents via Task tool for complex work
- **Incremental Changes**: Small, testable changes with frequent commits
- **Quality Gates**: All code must pass automated testing before merge
- **Safe Deployments**: Staging validation before production
- **Emergency Preparedness**: Multiple rollback strategies always available
- **Security First**: Employee data protection and HIPAA compliance considerations

### **Safety Protocols**
- **Pre-Change Validation**: Create backup tags before major changes
- **Testing Required**: Test all changes locally before committing
- **Documentation Updates**: Keep documentation current with code changes
- **Rollback Planning**: Always maintain ability to revert to previous versions

## 🎉 **Realtime Events (Socket.IO)**

- Events: `sms_sent`, `sms_delivery_update`
- Rooms: `contact_<contactId>` via `join_contact` / `leave_contact`

For detailed information on specific areas, use the **Task tool** with the appropriate **subagent type** to access specialized knowledge and capabilities.