# 🏥 PHARMACY SCHEDULING SYSTEM - Claude Code Project

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 **PROJECT OVERVIEW**

### **Core Purpose**
A modern, AI-powered pharmacy scheduling and communication system that provides:
- **Employee Management**: Complete employee information and profile management
- **Schedule Management**: Multi-store scheduling with historical data tracking
- **SMS Communication**: Direct messaging with employees via Capcom6 gateway
- **AI Analytics**: Intelligent chatbot with comprehensive data access and query capabilities
- **Document Ingestion**: Advanced multi-format document processing (Excel, PDF, CSV)
- **Message History**: Complete SMS conversation tracking and storage

### **Key Features**

#### **Frontend UI Components**
- **Employee Dashboard**: Employee profiles, contact information, role management
- **Schedule Interface**: Multi-store grid layout, shift assignment, historical views
- **SMS Communication**: Message threads, contact management, conversation history
- **AI Chatbot**: Analytical queries about employees, stores, and schedules
- **Data Import**: Excel file upload and processing interface

#### **Backend Services**
- **Database**: Supabase PostgreSQL with perpetual data storage
- **AI Integration**: OpenRouter with Qwen3 Coder model for analytics
- **SMS Gateway**: Capcom6 integration for employee messaging
- **Workflow Automation**: n8n middleware for system integration
- **Data Processing**: Excel file ingestion and data transformation

#### **AI Capabilities**
- **Comprehensive Data Access**: AI has access to all database tables, REST API endpoints, and query tools
- **Intelligent Query Strategy**: AI determines the best approach (REST API, SQL, SMS, n8n) for each query
- **Employee Analytics**: Query employee schedules, PTO, work patterns
- **Store Analytics**: Store performance, scheduling efficiency, coverage analysis
- **Schedule Analytics**: Historical trends, conflict detection, optimization insights
- **Employee Chat**: Limited AI assistance for employee queries
- **User Chat**: Full analytical capabilities for management users

### **Data Flow**
1. **Document Ingestion**: Multi-format files (Excel, PDF, CSV) → Advanced processing pipeline → Database ingestion
2. **Schedule Management**: Real-time schedule updates and historical tracking
3. **SMS Communication**: User ↔ Employee messaging via Capcom6
4. **AI Analytics**: Natural language queries → Intelligent query strategy selection → Multi-source data retrieval → Insights
5. **Message Storage**: All conversations stored perpetually in database

### **User Workflows**
- **Management**: Full access to all features, AI analytics, employee messaging
- **Employees**: Limited access to schedules, SMS communication, restricted AI chat
- **System**: Automated data processing, message routing, AI response generation

### **Development Roadmap**
- **Phase 1**: ✅ Core UI and database setup
- **Phase 2**: ✅ Advanced document ingestion system (Excel, PDF, CSV)
- **Phase 3**: ✅ SMS integration with Capcom6
- **Phase 4**: 🔄 AI chatbot with comprehensive data access and intelligent query strategies
- **Phase 5**: Advanced analytics and optimization
- **Phase 6**: ✅ n8n workflow automation
- **Phase 7**: Production deployment and monitoring

## ⚠️ CRITICAL MCP SERVER USAGE

### **🔧 Context7 MCP Server - PRIMARY TROUBLESHOOTING TOOL**
**ALWAYS use the context7 MCP server when troubleshooting ANY issue in this project**. Context7 is incredibly useful for solving most of our issues including:

- **Supabase Setup Issues**: Use context7 to research Supabase self-hosting documentation and troubleshooting guides
- **API Key & Authentication Problems**: Context7 can provide JWT token generation, API key validation, and authentication troubleshooting
- **Docker Container Issues**: Research Docker Compose configurations, container optimization, and service requirements
- **Library Integration Problems**: Get up-to-date documentation and code examples for any library or framework
- **Configuration Errors**: Research proper configuration patterns and troubleshooting steps
- **Database Schema Issues**: Find PostgreSQL and Supabase-specific solutions and best practices
- **Frontend Framework Problems**: Get React, TypeScript, Vite, and Tailwind CSS troubleshooting guidance
- **SMS Gateway Integration**: Research Capcom6 API documentation and integration patterns

**How to use context7 effectively:**
1. **Before implementing any solution**, use context7 to research the problem and gather relevant documentation
2. **When encountering errors**, use context7 to look up error messages and troubleshooting steps
3. **For configuration changes**, use context7 to verify proper patterns and best practices
4. **When integrating new libraries**, use context7 to get the latest documentation and examples

### **🤖 n8n Workflow Development**
**ALWAYS use the n8n-mcp server** when working with n8n workflows, automation, or any n8n-related tasks. This provides comprehensive access to n8n node documentation and workflow assistance.

**References for troubleshooting**:
- n8n-mcp server issues: https://github.com/czlonkowski/n8n-mcp
- n8n platform documentation: https://docs.n8n.io

## Project Overview

This is a comprehensive pharmacy scheduling and communication system designed for pharmacist schedulers to manage employee schedules, handle SMS communications, and interact with an AI chatbot for intelligent scheduling assistance.

### Core Functionality
1. **Document Ingestion**: Advanced multi-format document processing (Excel, PDF, CSV) with intelligent data mapping
2. **Schedule Management**: Multi-store, multi-employee scheduling with historical data tracking
3. **SMS Communication**: Two-way messaging with employees using Capcom6 SMS Gateway
4. **AI Chatbot**: Comprehensive intelligent assistant with access to all data endpoints and intelligent query strategy selection
5. **Smart Conversation Management**: Toggle between AI and direct human communication per employee
6. **Data Integration**: Multi-source data integration with real-time synchronization

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
- **AI Integration**: OpenRouter API with Qwen3 Coder model
- **Workflow Automation**: Self-hosted n8n for automation and integrations
- **SMS Gateway**: Capcom6 Android SMS Gateway via Tailscale network
- **Document Processing**: Advanced multi-format ingestion (Excel, PDF, CSV) with intelligent mapping
- **Containerization**: Docker with unified docker-compose.yml
- **Version Control**: Git with GitHub for change tracking and rollback capability

## Core Features & Requirements

### 📅 Schedule Management
- **Excel Import**: Multi-tabbed Excel file ingestion for regular data updates
- **Multi-Store View**: Access and manage schedules across all pharmacy locations
- **Employee Database**: Comprehensive employee information and scheduling history
- **Historical Tracking**: Perpetual storage of all schedule data for analytics
- **Real-time Updates**: Live schedule updates and notifications

### 💬 SMS Communication
- **Two-Way Messaging**: Send and receive SMS messages with employees
- **Message History**: Store and retrieve complete conversation history
- **Contact Management**: Organize employee contacts and communication preferences
- **Bulk Messaging**: Send notifications to multiple employees simultaneously

### 🤖 AI Chatbot Integration
- **Comprehensive Data Access**: AI has access to all database tables, REST API endpoints, and query tools
- **Intelligent Query Strategy Selection**: AI determines the best approach for each query:
  - **REST API Queries**: For simple data retrieval and filtering
  - **Direct SQL Queries**: For complex joins, aggregations, and custom analysis
  - **SMS Integration**: For sending messages and checking communication status
  - **n8n Workflows**: For triggering automated processes and bulk operations
- **Multi-Source Data Retrieval**: Combine data from multiple sources for comprehensive insights
- **Analytical Queries**: Employee, store, and schedule analytics via natural language
- **Dual-Mode Chat**: Full analytics for management, limited queries for employees
- **Qwen3 Coder Model**: OpenRouter integration for advanced AI capabilities
- **Real-Time Processing**: Live data access and instant response generation

### 🔄 Smart Conversation Management
- **Conversation Toggle**: Switch between AI chatbot and direct human communication
- **Individual Control**: Deactivate AI for specific employee conversations
- **Selective AI**: Other employees continue to interact with chatbot during direct conversations
- **Seamless Handoff**: Easy transition between AI and human communication modes

### 📄 Document Ingestion System
- **Multi-Format Support**: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf) file processing
- **Advanced Processing Pipeline**: Intelligent data extraction, validation, and transformation
- **Configurable Data Mapping**: Flexible column mapping and transformation rules
- **Progress Tracking**: Real-time upload and processing status monitoring
- **Import History**: Complete audit trail of all document imports and processing results
- **Error Handling**: Comprehensive error reporting and recovery mechanisms
- **Template-Based Processing**: Pre-configured templates for different document types
- **Batch Processing**: Support for multiple file uploads and processing

### 📊 Data Management
- **Document Integration**: Multi-format document import with intelligent data transformation
- **Database Storage**: Perpetual storage of schedules, messages, employee data, and import history
- **Real-time Sync**: Live synchronization between frontend and database
- **Message History**: Complete SMS conversation storage and retrieval
- **Backup & Recovery**: Automated data backup and recovery procedures
- **Version Control**: Git tracking for all changes with rollback capability

## 🔄 **DEVELOPMENT WORKFLOW & VERSION CONTROL**

### **Git Workflow & Best Practices**

#### **Branch Strategy**
- **`main`**: Production-ready stable releases only
- **`development`**: Active development and integration branch  
- **`feature/*`**: Individual feature development branches
- **`hotfix/*`**: Critical production fixes
- **`release/*`**: Release preparation branches

#### **Commit Guidelines**
- **Frequent Commits**: Commit working changes regularly (multiple times per day)
- **Atomic Commits**: Each commit should represent a single logical change
- **Descriptive Messages**: Use clear, descriptive commit messages with context
- **Conventional Commits**: Follow conventional commit format when possible

#### **Version Control Commands**
```bash
# Check current status and recent commits
git status
git log --oneline -10

# Create a new feature branch
git checkout -b feature/your-feature-name

# Stage and commit changes
git add .
git commit -m "feat: your descriptive commit message"

# Push to remote (requires authentication)
git push origin feature/your-feature-name

# Switch between branches
git checkout development
git checkout main

# Merge feature back to development
git checkout development
git merge feature/your-feature-name
git branch -d feature/your-feature-name
```

#### **Git Authentication Setup**
The project uses GitHub for remote repository hosting. Authentication is required for push operations:

**Personal Access Token (Recommended):**
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` and `workflow` scopes
3. Use token as password when prompted for `git push`
4. Credential helper caches token for 24 hours

**Test Authentication:**
```bash
# Test authentication and connection
./scripts/test-git-auth.sh

# Manual test
git push origin development
# Username: TheJimmerJammer123
# Password: [your Personal Access Token]
```

**SSH Alternative:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "thejimmerjammer123@gmail.com"

# Add to GitHub and change remote URL
git remote set-url origin git@github.com:TheJimmerJammer123/pharm-scheduling-project.git
```

#### **Rollback & Recovery Procedures**
```bash
# View recent commits to identify rollback target
git log --oneline -10

# Revert specific commit (safe - creates new commit)
git revert <commit-hash>

# Reset to previous commit (destructive - use carefully)
git reset --hard <commit-hash>

# Create backup before major changes
git tag backup-$(date +%Y%m%d-%H%M%S)

# Emergency rollback to last known working state
git checkout main
git log --oneline -5  # Find stable commit
git reset --hard <stable-commit-hash>
```

#### **Safety Protocols**
- **Test Before Commit**: Always test changes before committing
- **Backup Critical States**: Tag stable versions before major changes
- **Document Changes**: Update CLAUDE.md with significant modifications
- **Incremental Changes**: Make small, testable changes rather than large rewrites

### **Change Management Process**

#### **Development Cycle**
1. **Feature Planning**: Create todo list with TodoWrite tool
2. **Branch Creation**: Create feature branch from development
3. **Implementation**: Make incremental changes with frequent commits
4. **Testing**: Verify functionality with `docker compose up -d`
5. **Documentation**: Update CLAUDE.md and relevant documentation
6. **Integration**: Merge back to development branch
7. **Validation**: Full system test on development branch

#### **Emergency Procedures**
1. **Immediate Rollback**: Use `git revert` or `git reset` to stable state
2. **Service Recovery**: Restart Docker services if needed
3. **Data Backup**: Create emergency backup if database issues
4. **Issue Documentation**: Record what went wrong and how it was fixed

#### **Collaboration Workflow**
- **Code Review**: Review commits before merging to main
- **Conflict Resolution**: Use merge conflicts as learning opportunities
- **Knowledge Sharing**: Document decisions and learnings in commit messages
- **Rollback Planning**: Always maintain ability to revert to previous versions

## Development Commands

### Quick Start (Verified Working - 2025-08-05)
```bash
# Start all services (everything auto-initializes)
docker compose up -d

# Check all services are healthy (wait ~60 seconds for full startup)
docker compose ps

# Test API endpoints (load environment first)
source .env
curl -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" http://localhost:8002/rest/v1/stores

# Expected result: JSON array with 3 pharmacy stores
# Frontend accessible at: http://localhost:3000
# n8n workflow automation: http://localhost:5678 (admin/admin123)
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

### Database Schema (Complete Implementation)
**Core Pharmacy Tables:**
- `stores` - Pharmacy locations and information
- `contacts` - Employee contact information and profiles
- `store_schedules` - Employee scheduling data and shift assignments
- `messages` - SMS conversation history with Capcom6 integration
- `appointments` - Appointment management and scheduling

**Document Ingestion System Tables:**
- `document_imports` - Track file uploads and processing status
- `import_history` - Detailed import records and processing results
- `data_mappings` - Column mapping configurations for different file types
- `processing_templates` - Processing templates for different document formats

**Status:** ✅ All tables implemented with complete schema, indexes, triggers, and RLS policies

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
- **MCP Integration**: ✅ n8n-mcp server installed globally via npx
  - **Installation**: `npx n8n-mcp` (auto-installs and runs)
  - **Claude Code Configuration**: Add to your Claude Code MCP settings:
    ```json
    {
      "mcpServers": {
        "n8n-mcp": {
          "command": "npx",
          "args": ["n8n-mcp"],
          "env": {
            "MCP_MODE": "stdio",
            "LOG_LEVEL": "error",
            "DISABLE_CONSOLE_OUTPUT": "true"
          }
        }
      }
    }
    ```
  - **Configuration Location**: Add to your Claude Code settings file
  - **Features**: 532 n8n nodes with 99% property coverage, workflow assistance
- **Documentation**: 
  - n8n-mcp server: https://github.com/czlonkowski/n8n-mcp
  - Official n8n docs: https://docs.n8n.io
- **⚠️ IMPORTANT**: Configure n8n-mcp in Claude Code settings to enable AI workflow assistance

### Edge Functions ✅ OPERATIONAL
- **Document Upload**: `/functions/v1/document-upload` - Handle file uploads and validation
- **Excel Processing**: `/functions/v1/process-excel` - Process Excel files and import data
- **AI Chat Response**: `/functions/v1/ai-chat-response-sql` - AI-driven SQL analysis
- **SMS Integration**: `/functions/v1/send-sms-v3` - Send SMS via Capcom6
- **Webhook Processing**: `/functions/v1/capcom6-webhook` - Process incoming SMS

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
   - **Context7 MCP**: **PRIMARY TROUBLESHOOTING TOOL** - Use for ALL issues including Supabase, API keys, Docker, libraries, configuration errors, database problems, and integration issues
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

### Database Schema Status ✅ FULLY OPERATIONAL (Verified 2025-08-05)
The pharmacy database schema is confirmed working and auto-initializes perfectly. **Database authentication issues have been resolved** - all required users are now properly created during startup. The frontend TypeScript definitions in `src/lib/supabase.ts` match the actual database schema.

**Confirmed Working Tables:**
- `stores` - Pharmacy locations (✅ 3 sample records confirmed)
- `contacts` - Employee information (✅ 4 sample records confirmed)  
- `messages` - SMS communication with **real-time updates enabled**
- `store_schedules` - Employee scheduling
- `appointments` - Appointment management
- Document ingestion tables (document_imports, import_history, etc.)

The schema includes proper RLS policies, indexes, triggers, and **Realtime replication** for production-ready system with live updates.

### REST API Endpoints ✅ FULLY FUNCTIONAL (Tested 2025-08-05)
The PostgREST API is confirmed operational at `http://localhost:8002/rest/v1/` with **all authentication issues resolved**:

**Verified Working Endpoints:**
- ✅ `GET /rest/v1/stores` - Returns 3 pharmacy locations (tested)
- ✅ `GET /rest/v1/contacts` - Returns employee contacts (tested)
- ✅ `GET /rest/v1/messages` - SMS conversation history
- ✅ `GET /rest/v1/store_schedules` - Employee scheduling data
- ✅ `GET /rest/v1/appointments` - Appointment management

**Document Ingestion Endpoints:**
- ✅ `GET /rest/v1/document_imports` - Import history and status
- ✅ `GET /rest/v1/import_history` - Detailed import records
- ✅ `GET /rest/v1/data_mappings` - Column mapping configurations
- ✅ `GET /rest/v1/processing_templates` - Processing templates

**Authentication Status:**
- ✅ **Anon Access**: Working perfectly with `ANON_KEY`
- ✅ **Service Role**: `SERVICE_ROLE_KEY` for full CRUD operations
- ✅ **Row Level Security**: Implemented with appropriate policies
- ✅ **Environment Variables**: All keys properly configured

**Working Examples (Confirmed):**
```bash
# Load environment variables first
source .env

# Test stores endpoint (returns 3 stores)
curl -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" http://localhost:8002/rest/v1/stores

# Test contacts endpoint (returns 4 employee contacts)
curl -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" http://localhost:8002/rest/v1/contacts
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
- [x] **IMPLEMENTED ADVANCED DOCUMENT INGESTION SYSTEM** - Multi-format support (Excel, PDF, CSV) with intelligent processing
- [x] **CREATED DOCUMENT UPLOAD FRONTEND** - Drag-and-drop interface with progress tracking and import history
- [x] **BUILT PROCESSING PIPELINE** - Excel processing with data mapping and validation
- [x] **ADDED IMPORT MANAGEMENT** - Complete audit trail and status tracking for all document imports

### Current System Status ✅ FULLY OPERATIONAL (Updated: 2025-08-05)
**All core systems are confirmed working:**
- ✅ **Docker Services**: All critical containers running healthy (7/8 services)
  - ✅ **Database (supabase-db)**: Healthy, PostgreSQL 15.8.1.060
  - ✅ **API Gateway (kong)**: Healthy, port 8002 operational
  - ✅ **Authentication (auth)**: Healthy, GoTrue v2.177.0
  - ✅ **REST API (rest)**: Healthy, PostgREST v12.2.12
  - ✅ **Edge Functions**: Operational, Supabase Edge Runtime v1.67.4
  - ✅ **Frontend**: Healthy, React development server with hot reload
  - ✅ **n8n Workflow**: Healthy, automation platform accessible
  - ⚠️ **Connection Pooler**: Restarting (non-critical, direct DB access works)

- ✅ **Database Schema**: Complete pharmacy schema with all tables
  - ✅ **Sample Data**: Pre-loaded with 3 stores, 4 employee contacts
  - ✅ **Authentication Fixed**: All required database users properly created
  - ✅ **RLS Policies**: Row Level Security implemented
  - ✅ **Triggers & Indexes**: Performance optimizations in place

- ✅ **REST API Endpoints**: All endpoints tested and functional
  - ✅ **Stores API**: `GET /rest/v1/stores` - Returns 3 pharmacy locations
  - ✅ **Contacts API**: `GET /rest/v1/contacts` - Returns employee information
  - ✅ **Messages API**: Available for SMS conversation history
  - ✅ **Authentication**: Anon key authentication working perfectly
  - ✅ **CORS**: Properly configured for frontend access

- ✅ **Frontend Application**: React app fully operational
  - ✅ **Hot Reload**: Development mode with live updates
  - ✅ **Supabase Integration**: Correctly configured for API access
  - ✅ **Environment Variables**: All required variables properly set
  - ✅ **Port Access**: Accessible on http://localhost:3000

- ✅ **External Integrations**: All external services configured
  - ✅ **Capcom6 SMS**: Gateway configured (via Tailscale: 100.126.232.47:8080)
  - ✅ **OpenRouter AI**: API key configured for AI chatbot functionality
  - ✅ **n8n Automation**: Accessible on http://localhost:5678
  - ✅ **Environment Security**: All sensitive values properly secured

### Known Issues & Solutions

#### Connection Pooler (Supavisor) - Non-Critical
**Status**: ⚠️ Restarting intermittently  
**Impact**: None - Direct database access via port 8002 works perfectly  
**Cause**: Minor configuration issue with pooler initialization  
**Solution**: Not required for development - main API gateway handles all requests  
**Workaround**: Use direct API access instead of pooled connections

```bash
# Check pooler status (optional)
docker compose logs supavisor --tail=20

# Restart pooler if needed (usually not necessary)
docker compose restart supavisor
```

### Next Priority Tasks
- [ ] **Create Comprehensive AI Chatbot** - Implement AI with access to all data endpoints and intelligent query strategy selection
- [ ] **Upload and Process Excel Data** - Load actual pharmacy data using the document ingestion system
- [ ] **Enhance AI Query Capabilities** - Implement multi-source data retrieval and intelligent query routing
- [ ] **Build Advanced Analytics Dashboard** - Create comprehensive reporting and analytics interface
- [ ] **Implement Real-time Data Updates** - Add live data synchronization and notifications
- [ ] **Fix Connection Pooler** - Address pooler restart issues (low priority)

## MCP Server Integration

This project uses the following MCP servers for enhanced development capabilities:

### Context7 MCP Server ⭐ PRIMARY TROUBLESHOOTING TOOL
- **Purpose**: **PRIMARY troubleshooting and research tool** for all project issues
- **Usage**: **ALWAYS use FIRST when encountering ANY problem** - this server is incredibly useful for solving most issues
- **When to use**:
  - **Supabase Issues**: Self-hosting setup, authentication, API configuration
  - **Docker Problems**: Container configuration, service optimization, troubleshooting
  - **Library Integration**: Up-to-date documentation and examples for any framework
  - **Configuration Errors**: Research proper patterns and troubleshooting steps
  - **Database Issues**: PostgreSQL, schema problems, query optimization
  - **API & Authentication**: JWT tokens, API keys, authentication troubleshooting
  - **Frontend Issues**: React, TypeScript, Vite, Tailwind CSS problems
  - **SMS Gateway**: Capcom6 integration, webhook configuration
  - **ANY other technical issue**: Context7 provides comprehensive documentation access

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

## 📋 **SUBAGENT REFERENCE FILES**

The following subagent markdown files provide specialized context for Claude Code, aligned with the project roadmap and core requirements:

| File | Size | Purpose | Key Areas | When to Use |
|------|------|---------|-----------|-------------|
| `.claude/agents/frontend-developer.md` | 6.8KB | Frontend development | React, TypeScript, Tailwind CSS, Docker-only workflow, Plan→Act→Review | Frontend components, UI development, styling, employee data protection |
| `.claude/agents/backend-developer.md` | 15.2KB | Backend development | Supabase, PostgreSQL, Edge Functions, API development, Plan→Act→Review | Database schema, API endpoints, backend logic, employee data protection |
| `.claude/agents/sms-troubleshooter.md` | 11KB | SMS troubleshooting | Capcom6 gateway, webhook processing, SMS diagnostics, Plan→Act→Review | SMS issues, webhook problems, Capcom6 troubleshooting, employee data protection |
| `.claude/agents/n8n-automation.md` | 12KB | n8n workflow automation | n8n-mcp server, workflow creation, automation, Plan→Act→Review | Workflow automation, n8n configuration, automation tasks, employee data protection |
| `.claude/agents/docker-manager.md` | 11KB | Docker management | Docker Compose v2.38.2, container orchestration, service management, Plan→Act→Review | Docker operations, container management, service deployment, employee data protection |
| `.claude/agents/code-reviewer.md` | 8.5KB | Code review & security | Employee data protection, security audit, code quality | Code review, security validation, compliance checks |
| `.claude/agents/test-runner.md` | 9.8KB | Automated testing | Test execution, quality assurance, pharmacy validation | Test running, failure analysis, continuous testing |
| `.claude/agents/workflow-orchestrator.md` | 7.2KB | Workflow coordination | Plan→Act→Review, subagent coordination, process management | Complex tasks, feature implementation, workflow management |
| `.claude/agents/data-processor.md` | 12.5KB | Excel processing & AI integration | Excel ingestion, data transformation, OpenRouter/Qwen3 Coder, analytics | Excel import, AI integration, analytical queries, data processing |
| `.claude/agents/project-organizer.md` | 4.2KB | Project organization & file management | File organization, documentation updates, code refactoring, structure maintenance | File moves, documentation updates, project structure, organization standards |
| `.claude/agents/mcp-server-developer.md` | 5.8KB | MCP server development & management | MCP protocol, server development, tool integration, external service connectivity | MCP servers, tool integration, protocol implementation, service connectivity |

**Total Subagent Coverage**: 104.6KB of specialized knowledge

**Note**: All subagents are now properly formatted according to the [official Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents) with YAML frontmatter, correct naming conventions, and proper tool specifications.

### **Best Practices Applied from Research**

Based on research from [Apidog's sub-agent guide](https://apidog.com/blog/claude-code-sub-agents/), [Jewel Huq's practical guide](https://jewelhuq.medium.com/practical-guide-to-mastering-claude-codes-main-agent-and-sub-agents-fd52952dcf00), and [Cuong's deep dive](https://cuong.io/blog/2025/06/24-claude-code-subagent-deep-dive), we've implemented and **enhanced all subagents** with:

#### **Workflow Management**
- **Plan → Act → Review**: Structured development workflow with clear phases
- **Task Specialization**: Each subagent has focused, non-overlapping responsibilities
- **Parallel Processing**: Subagents can work independently and in parallel
- **Context Isolation**: Each subagent maintains its own context window

#### **Security & Safety**
- **Least-Privilege Tools**: Granular tool access control per subagent
- **HIPAA Compliance**: Pharmacy-specific security and compliance focus
- **Quality Gates**: Mandatory code review, testing, and security validation
- **Rollback Procedures**: Emergency procedures for critical issues

#### **Team Collaboration**
- **Version Control**: Subagents are versioned like code in `.claude/agents/`
- **Reusability**: Subagents can be shared across team members
- **Documentation**: Comprehensive documentation for each subagent
- **Best Practices**: Industry-standard development practices

#### **Performance Optimization**
- **Resource Monitoring**: Track subagent performance and resource usage
- **Efficient Delegation**: Automatic delegation based on task descriptions
- **Continuous Improvement**: Feedback loops for subagent optimization
- **Scalability**: Easy to add new subagents as project grows

#### **Enhanced Subagent Features**
- **Plan → Act → Review**: All subagents now implement structured workflow
- **Pharmacy-Specific Security**: Employee data protection and pharmacy business security
- **Quality Gates**: Mandatory review processes for all subagents
- **Context Isolation**: Each subagent maintains focused, specialized context
- **Team Collaboration**: Version-controlled, reusable subagents with clear documentation