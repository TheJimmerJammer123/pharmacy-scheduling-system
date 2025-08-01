# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT MCP SERVER USAGE

**n8n Workflow Development**: When working with n8n workflows, automation, or any n8n-related tasks, **ALWAYS use the n8n-mcp server**. This provides comprehensive access to n8n node documentation and workflow assistance.

**References for troubleshooting**:
- n8n-mcp server issues: https://github.com/czlonkowski/n8n-mcp
- n8n platform documentation: https://docs.n8n.io

## Project Overview

This is a comprehensive pharmacy scheduling and communication system designed for pharmacist schedulers to manage employee schedules, handle SMS communications, and interact with an AI chatbot for intelligent scheduling assistance.

### Core Functionality
1. **Schedule Management**: Import Excel scheduling data and provide multi-store, multi-employee access
2. **SMS Communication**: Two-way messaging with employees using Capcom6 SMS Gateway
3. **AI Chatbot**: Intelligent assistant with SQL query capabilities for scheduling questions
4. **Smart Conversation Management**: Toggle between AI and direct human communication per employee
5. **Data Integration**: Excel import, database storage, and real-time synchronization

### Key Features
- **Excel Import**: Load scheduling data from existing Excel workflows
- **Multi-Store Support**: Access schedules across all pharmacy locations
- **Employee Database**: Comprehensive employee information and communication history
- **AI Integration**: Chatbot with direct database access for real-time information
- **Conversation Control**: Selective AI deactivation for direct human conversations
- **Message History**: Complete SMS conversation storage and retrieval

### Technical Stack
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Self-hosted Supabase (PostgreSQL, PostgREST, GoTrue, Realtime)
- **Workflow Automation**: Self-hosted n8n for automation and integrations
- **SMS Gateway**: Capcom6 Android SMS Gateway via Tailscale network
- **Containerization**: Docker with unified docker-compose.yml

## Core Features & Requirements

### 📅 Schedule Management
- **Excel Import**: Load scheduling data from Excel files for all stores and employees
- **Multi-Store View**: Access and manage schedules across all pharmacy locations
- **Employee Database**: Comprehensive employee information and scheduling history
- **Real-time Updates**: Live schedule updates and notifications

### 💬 SMS Communication
- **Two-Way Messaging**: Send and receive SMS messages with employees
- **Message History**: Store and retrieve complete conversation history
- **Contact Management**: Organize employee contacts and communication preferences
- **Bulk Messaging**: Send notifications to multiple employees simultaneously

### 🤖 AI Chatbot Integration
- **Intelligent Assistant**: AI chatbot for scheduling queries and employee questions
- **SQL Query Capabilities**: Direct database access for real-time schedule information
- **Contextual Responses**: AI understands pharmacy scheduling context and terminology
- **Employee Support**: Automated responses to common scheduling questions

### 🔄 Smart Conversation Management
- **Conversation Toggle**: Switch between AI chatbot and direct human communication
- **Individual Control**: Deactivate AI for specific employee conversations
- **Selective AI**: Other employees continue to interact with chatbot during direct conversations
- **Seamless Handoff**: Easy transition between AI and human communication modes

### 📊 Data Management
- **Excel Integration**: Import scheduling data from existing Excel workflows
- **Database Storage**: Secure storage of schedules, messages, and employee data
- **Real-time Sync**: Live synchronization between frontend and database
- **Backup & Recovery**: Automated data backup and recovery procedures

## Development Commands

### Quick Start (After Recent Fixes)
```bash
# Start all services (everything auto-initializes)
docker compose up -d

# Check all services are healthy
docker compose ps

# Test API endpoints
curl -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" http://localhost:8002/rest/v1/stores
```

### Docker Services
```bash
# Start all services
docker compose up -d

# View service status
docker compose ps

# View logs for specific service
docker compose logs <service_name>

# Stop all services
docker compose down

# Full reset (destructive)
docker compose down -v
```

### Frontend Development
```bash
# Docker-based development (recommended)
docker compose up -d frontend    # Start frontend with hot reload
docker compose logs frontend     # View frontend logs
docker compose restart frontend  # Restart frontend service

# Local development (alternative)
cd frontend/
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint checking
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
```

### Database Operations
```bash
# Access database directly
psql postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5433/postgres

# View Supabase Studio
open http://localhost:3001
# Username: supabase
# Password: this_password_is_insecure_and_should_be_updated
```

### n8n Workflow Operations
```bash
# Access n8n web interface
open http://localhost:5678
# Username: admin (from .env N8N_BASIC_AUTH_USER)
# Password: from .env N8N_BASIC_AUTH_PASSWORD

# Check n8n container status
docker compose ps n8n

# View n8n logs
docker compose logs n8n --tail=20

# Restart n8n service
docker compose restart n8n

# Check n8n-mcp server status (for AI assistance)
docker compose ps n8n-mcp
docker compose logs n8n-mcp --tail=10

# Access n8n database (PostgreSQL with n8n schema)
psql postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5433/postgres -c "SET search_path TO n8n; \dt"
```

### n8n Troubleshooting
```bash
# If n8n web interface is not accessible
docker compose restart n8n kong

# If workflows are not executing
docker compose logs n8n | grep -i error

# If database connection issues
docker compose exec db psql -U postgres -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'n8n';"

# Reset n8n data (DESTRUCTIVE - removes all workflows)
docker compose down n8n
docker volume rm supabase_n8n_data
docker compose up -d n8n
```

**⚠️ Important**: Always use the n8n-mcp server when working with n8n workflows. Reference:
- n8n-mcp server: https://github.com/czlonkowski/n8n-mcp
- n8n documentation: https://docs.n8n.io
```

## Architecture & Code Organization

### Directory Structure
- `frontend/` - React application with Vite + TypeScript + Tailwind CSS
- `supabase/` - **Self-hosted Supabase configuration** (volumes, configs, migrations)
- `scripts/` - Project-wide utilities and helper scripts
- `volumes/` - Legacy Docker volumes (being phased out in favor of supabase/volumes/)

### Key Frontend Architecture
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React Query + React Context
- **Routing**: React Router DOM
- **API Client**: Supabase JavaScript client
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Jest + React Testing Library

### Database Schema (Expected vs Actual)
**Frontend expects these tables:**
- `contacts` - Employee contact information
- `messages` - SMS conversation history  
- `stores` - Pharmacy locations
- `store_schedules` - Employee scheduling data
- `appointments` - Appointment management

**Current database has:**
- `profiles` - Basic user profiles only

**Action needed:** Database migrations must be created to match frontend expectations.

## Service Ports

- **Frontend**: 3000 (Dockerized Vite dev server with hot reload)
- **Supabase Studio**: 3001 (Docker mapped, accessible from host)
- **n8n Web Interface**: 5678 (workflow automation platform)
- **API Gateway (Kong)**: 8002 (main external access point) ✅ **CORRECT PORT**
- **PostgreSQL**: 5433 (external connection via Supavisor)
- **Connection Pooler**: 6543 (transaction pooling)
- **Analytics (Logflare)**: 4000 (internal monitoring)
- **Capcom6 SMS**: 100.126.232.47:8080 (via Tailscale)

## External Integrations

### Capcom6 SMS Gateway ✅ FULLY OPERATIONAL
- **Mode**: Local server via Tailscale network
- **Server URL**: http://100.126.232.47:8080
- **Authentication**: Basic auth (username: sms, password: ciSEJNmY)
- **Webhook endpoint**: `/functions/v1/capcom6-webhook`
- **External webhook URL**: `https://webhook.jammer-industries.com/functions/v1/capcom6-webhook`
- **Documentation**: 
  - **Official Repository**: [Capcom6 Android SMS Gateway](https://github.com/capcom6/android-sms-gateway)
  - **API Documentation**: [Capcom6 API Specification](https://capcom6.github.io/android-sms-gateway/)
  - **Webhook Format**: Supports both new (`{"event": "sms:received", "payload": {...}}`) and legacy formats
- **Status**: ✅ Sending and receiving SMS messages working with real-time updates

### n8n Workflow Automation ✅ OPERATIONAL
- **Web Interface**: http://localhost:5678
- **Authentication**: Basic auth (admin/configured-password)
- **Database**: Uses existing PostgreSQL instance with dedicated schema
- **Use Cases**: 
  - SMS workflow automation
  - Schedule change notifications  
  - Data synchronization between systems
  - Employee onboarding workflows
  - Report generation and distribution
- **MCP Integration**: n8n-mcp server provides AI assistance for workflow creation
- **Documentation**: 
  - n8n-mcp server: https://github.com/czlonkowski/n8n-mcp
  - Official n8n docs: https://docs.n8n.io
- **⚠️ IMPORTANT**: Always use the n8n-mcp server for AI assistance when working with n8n workflows

## Project Organization Guidelines

### Code Organization Rules

1. **Service Isolation**: Each service must have its own directory with all related files
2. **Docker-First**: All services should be containerized and defined in the unified `docker-compose.yml`
3. **Best Practices**: 
   - Write concise, readable code
   - Follow language-specific conventions
   - Include proper error handling
   - Add comprehensive documentation
   - Use meaningful variable and function names
4. **Configuration Management**: Keep configuration files in dedicated `config/` subdirectories
5. **Testing**: Include tests for all services in their respective `tests/` directories

### File Naming Conventions

- Use kebab-case for directories and files
- Use descriptive names that indicate purpose
- Include version numbers in configuration files when appropriate
- Use `.md` extension for all documentation files

### Git Workflow

- Keep commits atomic and focused
- Use descriptive commit messages
- Include service prefix in commit messages (e.g., `[frontend]`, `[supabase]`)
- Update `CLAUDE.local.md` with important context and decisions

## Development Workflow

1. **Service Development**: Always work within the appropriate service directory
2. **Docker Integration**: Test services using the unified docker-compose setup
3. **MCP Integration**: Use the appropriate MCP server for service-specific tasks
   - **Context7 MCP**: For general code analysis and documentation
   - **Playwright MCP**: For frontend testing and debugging
   - **Supabase MCP**: For backend database and API operations
   - **n8n MCP**: **MANDATORY** for all n8n workflow development and troubleshooting
4. **n8n Workflow Development**: 
   - **ALWAYS** use the n8n-mcp server before creating/modifying workflows
   - Reference https://github.com/czlonkowski/n8n-mcp for MCP server issues
   - Reference https://docs.n8n.io for n8n platform documentation
   - Test workflows in the n8n web interface at http://localhost:5678
5. **Testing**: Run tests before committing changes
6. **Documentation**: Update relevant documentation when making changes
7. **Backend First**: Ensure database schema matches frontend TypeScript types
8. **API-First**: PostgREST provides auto-generated REST API from database schema
9. **Real-time**: Use Supabase Realtime for live updates

## Testing Strategy

- **Frontend**: Jest for unit tests, React Testing Library for component tests
- **Integration**: Playwright for end-to-end testing  
- **Database**: Test against actual PostgreSQL instance
- **API**: Test PostgREST endpoints directly

## Important Development Notes

### Database Schema Status ✅ FULLY OPERATIONAL
The pharmacy database schema is now fully implemented and automatically initialized. The frontend TypeScript definitions in `src/lib/supabase.ts` match the actual database schema. All required tables are created automatically during Docker startup:
- `stores` - Pharmacy locations (3 sample records)
- `contacts` - Employee information (4 sample records)  
- `messages` - SMS communication with **real-time updates enabled**
- `store_schedules` - Employee scheduling
- `appointments` - Appointment management

The schema includes proper RLS policies, indexes, triggers, and **Realtime replication** for a production-ready system with live updates.

### REST API Endpoints ✅ FULLY FUNCTIONAL
The PostgREST API is operational at `http://localhost:8002/rest/v1/` with all pharmacy tables accessible:

**Available Endpoints:**
- `GET /rest/v1/stores` - Pharmacy locations
- `GET /rest/v1/contacts` - Employee contacts  
- `GET /rest/v1/messages` - SMS conversation history
- `GET /rest/v1/store_schedules` - Employee scheduling data
- `GET /rest/v1/appointments` - Appointment management

**Authentication:**
- **Anon Access**: Uses `ANON_KEY` for read operations
- **Service Role**: Uses `SERVICE_ROLE_KEY` for full CRUD operations
- **Row Level Security**: Implemented with appropriate policies

**Testing Examples:**
```bash
# Test with anon key (read-only)
curl -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" http://localhost:8002/rest/v1/stores

# Test with service role (full access)  
curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $ANON_KEY" http://localhost:8002/rest/v1/contacts
```

### Backend Directory Structure
The `supabase/` directory contains the actual project backend configuration including Docker Compose setup, database volumes, and Supabase-specific files. This is the working backend for the pharmacy project.

### Environment Configuration
- Use a single unified `.env` file in the project root directory
- Keep sensitive data in `.env` files (not committed to git)
- Document all required environment variables in `CLAUDE.local.md`
- Reference the [official Supabase self-hosting documentation](https://supabase.com/docs/guides/self-hosting/docker) for environment variable setup

### Performance and Security
- Follow security best practices for each technology stack
- Optimize Docker images for size and performance
- Implement proper logging and monitoring
- Use health checks for all services
- Implement proper error handling and recovery mechanisms

## Supabase Self-Hosting Reference

For Supabase setup issues, refer to the [official Supabase self-hosting documentation](https://supabase.com/docs/guides/self-hosting/docker).

**Key Supabase Setup Steps:**
1. Use `docker compose up -d` to start services
2. Check service health with `docker compose ps`
3. Access Supabase Studio at `http://localhost:3001`
4. Default credentials: `supabase` / `this_password_is_insecure_and_should_be_updated`
5. API endpoints available at `http://localhost:8002`
6. Database accessible via Supavisor pooler on port 5433

## Current Project Status

### Completed Tasks
- [x] Create service directories (supabase/, frontend/, scripts/)
- [x] Set up unified docker-compose.yml with official Supabase configuration
- [x] Create .gitignore file
- [x] Set up basic README.md
- [x] Reorganize project structure with supabase as backend
- [x] Integrate Vite + React + TypeScript + Tailwind CSS + shadcn/ui frontend
- [x] Set up Docker containerization with hot reload for frontend
- [x] Configure Capcom6 SMS Gateway for local server mode via Tailscale
- [x] Adjust port configuration to avoid conflicts with existing services
- [x] Clean up frontend directory, removing irrelevant files from original repository
- [x] Fix Docker Compose volume paths to use correct SQL initialization files
- [x] Resolve _supabase database creation issue for analytics service
- [x] Fix Studio service port mapping in Docker Compose configuration
- [x] Ensure all Docker services start properly and are accessible
- [x] Dockerize frontend application with hot reload development setup
- [x] Configure Docker Compose volumes for frontend hot reload functionality
- [x] Add frontend service to unified docker-compose.yml configuration
- [x] Implement improved Dockerfile.dev based on pharm-scheduling-hub inspiration
- [x] Enhanced environment variable configuration for SMS gateway and app settings
- [x] Improved Vite configuration with better IPv6 support and HMR optimization
- [x] **FIXED DATABASE AUTHENTICATION ISSUES** - Set proper passwords for all database users
- [x] **IMPLEMENTED PHARMACY DATABASE SCHEMA** - All tables, indexes, triggers, and RLS policies
- [x] **FIXED FRONTEND CONFIGURATION** - Corrected API URL from port 8000 to 8002
- [x] **VERIFIED REST API FUNCTIONALITY** - All endpoints operational with proper authentication
- [x] **ENSURED PERSISTENCE** - Database schema auto-initializes on fresh deployments
- [x] **ADDED N8N WORKFLOW AUTOMATION** - Self-hosted n8n instance with PostgreSQL integration
- [x] **INSTALLED N8N-MCP SERVER** - AI assistance for workflow creation and node documentation

### Current System Status ✅ FULLY OPERATIONAL
**All core systems are working:**
- ✅ **Docker Services**: All containers running healthy
- ✅ **Database**: PostgreSQL with complete pharmacy schema  
- ✅ **REST API**: PostgREST endpoints fully functional
- ✅ **Frontend**: React app with correct Supabase configuration
- ✅ **Real-time Updates**: Live message updates with auto-scroll to bottom
- ✅ **SMS Integration**: Capcom6 gateway fully operational
  - ✅ **Outbound SMS**: Sending messages via Edge Functions
  - ✅ **Inbound SMS**: Webhook receiving messages with real-time updates
  - ✅ **Auto-scroll**: New messages appear at bottom with smooth scrolling
  - ✅ **Smart Notifications**: Toast notifications only on non-messaging tabs
- ✅ **Workflow Automation**: n8n platform operational with basic auth
- ✅ **MCP Integration**: n8n-mcp server providing AI workflow assistance
- ✅ **AI Chatbot**: Basic AI assistant integrated with OpenRouter API
- ✅ **Authentication**: Both anon and service role access working
- ✅ **Persistence**: All configurations survive Docker restarts

### Next Priority Tasks
- [ ] Implement Excel import functionality
- [ ] Enhance AI chatbot with SQL query capabilities (basic AI chatbot now implemented)
- [ ] Implement SMS conversation management system
- [ ] Build frontend UI components for pharmacy management
- [ ] Add real-time subscriptions for live data updates

## MCP Server Integration

This project uses the following MCP servers for enhanced development capabilities:

### Context7 MCP Server
- **Purpose**: Enhanced context management and code understanding
- **Usage**: Always active for general development tasks
- **When to use**: Code analysis, refactoring, documentation generation

### Playwright MCP Server
- **Purpose**: Frontend testing and debugging
- **Usage**: Use when working with frontend services
- **When to use**:
  - Frontend debugging and testing
  - UI automation
  - End-to-end testing
  - Browser interaction tasks
  - Frontend performance optimization

### Supabase MCP Server
- **Purpose**: Backend service interaction and management (Supabase)
- **Usage**: Use when working with backend services
- **When to use**:
  - Database operations and queries
  - Supabase configuration management
  - Migration creation and management
  - Edge function development
  - Authentication setup
  - Real-time subscriptions
  - Backend API development

### n8n MCP Server ✅ INSTALLED & REQUIRED FOR N8N WORK
- **Purpose**: AI assistance for n8n workflow creation and documentation
- **Container**: n8n-mcp running alongside n8n instance  
- **Repository**: https://github.com/czlonkowski/n8n-mcp
- **Usage**: **ALWAYS use this MCP server when working with n8n**
- **Features**: 
  - 532 n8n nodes with 99% property coverage
  - Node documentation and examples
  - Workflow validation assistance
  - Integration guidance for pharmacy-specific automation
- **⚠️ MANDATORY for**:
  - Creating SMS automation workflows
  - Building schedule notification systems
  - Integrating pharmacy systems with n8n
  - Automating employee onboarding workflows
  - Setting up data synchronization workflows
  - Any n8n workflow development or troubleshooting
- **Troubleshooting**: 
  - n8n-mcp issues: https://github.com/czlonkowski/n8n-mcp/issues
  - n8n platform issues: https://docs.n8n.io
  - Container status: `docker compose logs n8n-mcp`

### Docker Operations & MCP Integration

When working with Docker containers and services, use appropriate tools for:

#### Container Management
- Starting/stopping/restarting services
- Checking container status and health
- Managing container resources and performance
- Troubleshooting container issues

#### Service Orchestration
- Managing the unified docker-compose.yml
- Coordinating multi-service deployments
- Handling service dependencies and startup order
- Monitoring service communication and networking

#### Development Environment
- Hot reload configuration for frontend development
- Volume mounting and data persistence
- Environment variable management
- Port mapping and network configuration