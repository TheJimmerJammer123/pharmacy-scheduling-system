# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **API Gateway (Kong)**: 8002 (main external access point)
- **PostgreSQL**: 5433 (external connection via Supavisor)
- **Connection Pooler**: 6543 (transaction pooling)
- **Analytics (Logflare)**: 4000 (internal monitoring)
- **Capcom6 SMS**: 100.126.232.47:8080 (via Tailscale)

## External Integrations

### Capcom6 SMS Gateway
- **Mode**: Local server via Tailscale network
- **Authentication**: Basic auth (username: sms, password: ciSEJNmy)
- **Webhook endpoint**: `/functions/v1/capcom6-webhook`

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
4. **Testing**: Run tests before committing changes
5. **Documentation**: Update relevant documentation when making changes
6. **Backend First**: Ensure database schema matches frontend TypeScript types
7. **API-First**: PostgREST provides auto-generated REST API from database schema
8. **Real-time**: Use Supabase Realtime for live updates

## Testing Strategy

- **Frontend**: Jest for unit tests, React Testing Library for component tests
- **Integration**: Playwright for end-to-end testing  
- **Database**: Test against actual PostgreSQL instance
- **API**: Test PostgREST endpoints directly

## Important Development Notes

### Schema Mismatch Issue
The frontend TypeScript definitions in `src/lib/supabase.ts` define a complete pharmacy database schema, but the actual database only contains basic Supabase tables. Priority should be given to implementing the missing database schema.

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

### Next Priority Tasks
- [ ] Set up Supabase project with scheduling database schema
- [ ] Implement Excel import functionality
- [ ] Create AI chatbot integration with SQL query capabilities
- [ ] Implement SMS conversation management system
- [ ] Set up development environment with proper environment variables

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