# 🏥 Pharmacy Scheduling System

A modern, AI-powered pharmacy scheduling and communication system built with a simplified architecture for better performance, maintainability, and cost efficiency.

## 🎯 Project Overview

This system enables pharmacist schedulers to:
- **Manage Employee Schedules**: Import and view scheduling data from Excel files across all stores and employees
- **SMS Communication**: Send, receive, and store SMS messages with employees using Capcom6 Android SMS Gateway running in Local Server mode over Tailscale. ✅ OPERATIONAL
  - Gateway URL: `http://100.126.232.47:8080`
  - Mode: Local Server (device-hosted) via Tailscale
  - Documentation: [Official Repository](https://github.com/capcom6/android-sms-gateway), [API Spec](https://capcom6.github.io/android-sms-gateway/)
- **AI-Powered Assistance**: Chat with an intelligent AI bot that can query scheduling data and answer employee-related questions
- **Smart Conversation Management**: Toggle between AI chatbot and direct human communication for individual employee conversations
- **Multi-Store Support**: Access scheduling data for all pharmacy locations and employees

## 🏗️ Architecture

This project uses a **simplified 4-service architecture** that eliminates complex dependencies and vendor lock-in:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │    │      N8N        │
│                 │    │                 │    │                 │    │                 │
│ React + TypeScript │ │ Node.js + Express│ │   PostgreSQL    │    │   Workflows     │
│ Vite + Tailwind    │ │ Socket.IO       │    │   Direct Conn   │    │   Automation    │
│ Port: 3000         │ │ JWT Auth        │    │   Port: 5432    │    │   Port: 5678    │
│                    │ │ Port: 3001      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components:
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + Socket.IO (REST API, real-time features, JWT authentication)
- **Database**: Direct PostgreSQL connection (no external services)
- **SMS Gateway**: Capcom6 Android SMS Gateway (local server mode via Tailscale) ✅ **OPERATIONAL**
- **Workflow Automation**: Self-hosted n8n for advanced automation and integrations
- **AI Integration**: OpenRouter API for intelligent chatbot features
- **Containerization**: Docker with unified docker-compose.yml

### Migration Benefits:
- **50% fewer services** (4 vs 8+ services)
- **No external dependencies** on Supabase
- **100% cost reduction** from subscription services
- **Direct database control** and optimization
- **Simplified deployment** and maintenance

## ✨ Core Features

### 📅 **Schedule Management**
- **Excel Import**: Load scheduling data from Excel files for all stores and employees
- **Multi-Store View**: Access and manage schedules across all pharmacy locations
- **Employee Database**: Comprehensive employee information and scheduling history
- **Real-time Updates**: Live schedule updates and notifications

### 💬 **SMS Communication** ✅ **FULLY OPERATIONAL**
- **Two-Way Messaging**: Send and receive SMS messages with employees via Capcom6 gateway
- **Real-time Updates**: Live message updates with auto-scroll to newest messages
- **Message History**: Store and retrieve complete conversation history with full metadata
- **Contact Management**: Organize employee contacts and communication preferences
- **Smart Notifications**: Toast alerts only when not actively viewing messages
- **Webhook Integration**: Automatic message processing from Capcom6 SMS gateway

### 🤖 **AI Chatbot Integration** ✅ **BASIC VERSION OPERATIONAL**
- **Intelligent Assistant**: AI chatbot for general pharmacy and scheduling questions
- **OpenRouter Integration**: Powered by GPT-3.5-turbo for natural conversations
- **Real-time Chat**: Instant responses with auto-scroll and message history
- **Pharmacy Context**: Understands pharmacy operations and employee management
- **Future Enhancement**: SQL query capabilities for direct schedule access (planned)

### 🔄 **Smart Conversation Management**
- **Conversation Toggle**: Switch between AI chatbot and direct human communication
- **Individual Control**: Deactivate AI for specific employee conversations
- **Selective AI**: Other employees continue to interact with chatbot during direct conversations
- **Seamless Handoff**: Easy transition between AI and human communication modes

### 📊 **Data Management**
- **Excel Integration**: Import scheduling data from existing Excel workflows
- **Database Storage**: Secure storage of schedules, messages, and employee data
- **Real-time Sync**: Live synchronization between frontend and database
- **Backup & Recovery**: Automated data backup and recovery procedures

## 📁 Project Structure

```
pharmacy-scheduling-system/
├── .claude/                     # Claude Code configuration and subagents
├── data/                        # Organized data storage and processing
│   ├── imports/                 # Original source files (Excel, CSV, PDF)
│   ├── processed/               # Processed and transformed data files
│   ├── exports/                 # Generated reports and export files
│   └── backups/                 # Data backups and archives
├── docs/                        # Comprehensive documentation
│   ├── architecture/            # System design and technical documentation
│   ├── api/                     # API documentation and specifications
│   └── deployment/              # Deployment guides and operations
├── frontend/                    # React application
│   ├── src/                     # Source code
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and API clients
│   │   ├── pages/               # Page components
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── tests/                   # Test files
│   ├── Dockerfile               # Frontend container
│   └── package.json             # Dependencies
├── scripts/                     # Organized utility scripts and automation
│   ├── data-processing/         # Data import, transformation, and processing
│   ├── database/                # Database maintenance and optimization
│   ├── deployment/              # Deployment automation and environment setup
│   └── utilities/               # General utility scripts and helper tools
├── backend/                     # Node.js + Express backend
│   ├── server.js               # Main server file
│   ├── db/                     # Database initialization scripts
│   └── package.json            # Backend dependencies
├── CLAUDE.md                    # Main project documentation and guidelines
├── docker-compose.yml           # Main Docker Compose configuration
├── package.json                 # Root project configuration and scripts
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
└── README.md                    # This project overview
```

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for frontend development)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pharm-project
   ```

2. Start the development environment:
   ```bash
   docker compose up -d
   ```

3. Access the services:
   - Frontend: [http://100.120.219.68:3000](http://100.120.219.68:3000) ✅ **OPERATIONAL**
   - Backend API: [http://100.120.219.68:3001](http://100.120.219.68:3001) ✅ **OPERATIONAL**
   - n8n Workflow Platform: [http://100.120.219.68:5678](http://100.120.219.68:5678) ✅ **OPERATIONAL**

## 🛠️ Development

### MCP Server Integration

This project uses Model Context Protocol (MCP) servers for enhanced development:

- **Context7 MCP**: General code understanding and analysis
- **Playwright MCP**: Frontend testing and debugging
- **Backend MCP**: Backend service interaction and management

### Development Workflow

1. **Service Development**: Work within the appropriate service directory
2. **Docker Integration**: Test services using the unified docker-compose setup
3. **MCP Integration**: Use the appropriate MCP server for service-specific tasks
4. **Testing**: Run tests before committing changes
5. **Documentation**: Update relevant documentation when making changes

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

## 🧪 Testing

- **Frontend**: Playwright for end-to-end testing
- **Backend**: Node.js testing tools and database testing

## 📦 Deployment

The project uses Docker for containerization and can be deployed using:

```bash
docker-compose -f docker-compose.yml up -d
```

## 🌐 Service Access

Once started, access these services:

### **Main Applications**
- **🌐 Frontend App**: [http://100.120.219.68:3000](http://100.120.219.68:3000) ✅ **OPERATIONAL**
- **⚙️ n8n Workflow Automation**: [http://100.120.219.68:5678](http://100.120.219.68:5678) ✅ **OPERATIONAL**
  - Username: `admin`
  - Password: set via N8N_BASIC_AUTH_PASSWORD in .env`admin123`

### **API Endpoints**
- **Backend REST API**: `http://100.120.219.68:3001/api` ✅ **OPERATIONAL**
- **Health**: `http://100.120.219.68:3001/api/health`
- **SMS Send**: `http://100.120.219.68:3001/api/send-sms` (uses Capcom6 Local Server at `http://100.126.232.47:8080`)
- **Messages**: `http://100.120.219.68:3001/api/messages/:contactId`
- **Contacts**: `http://100.120.219.68:3001/api/contacts`

### **Database Access**
- **Direct PostgreSQL**: `localhost:5432` (internal Docker network)

### **External Services**
- **📱 Capcom6 SMS Gateway (via Tailscale) ✅ OPERATIONAL**
  - Mode: Local Server (device-hosted)
  - Gateway URL: `http://100.126.232.47:8080`
  - Webhook URL (backend): `http://100.120.219.68:3001/api/webhooks/capcom6`
  - Documentation:
    - [Official Repository](https://github.com/capcom6/android-sms-gateway)
    - [API Specification](https://capcom6.github.io/android-sms-gateway/)
  - Status: ✅ Sending and receiving SMS with real-time updates

## 📋 Current System Status

### ✅ **Fully Operational Components**
- **🐳 Docker Services**: 4 core services running and fully operational
- **🗃️ Database**: PostgreSQL with complete pharmacy schema
- **⚙️ Backend API**: Node.js + Express on port 3001
- **⚛️ Frontend**: React app with hot reload
- **📱 SMS Integration**: Two-way SMS via Capcom6 (webhook to backend)
- **🤖 AI Assistant**: Basic chatbot integration with OpenRouter API
- **🔄 Real-time Updates**: Socket.IO SMS updates
- **⚙️ Workflow Automation**: n8n platform with MCP AI assistance
- **🔐 Authentication**: JWT-based auth via backend

### 🚧 **In Development**
- **📊 Excel Import**: Schedule data import functionality (backend route planned)
- **🔍 Advanced AI**: SQL query capabilities for AI chatbot (enhancement planned)
- **📈 Advanced Analytics**: Comprehensive reporting and insights

### 🎯 **Next Priority Features**
- Employee onboarding automation via n8n workflows
- Advanced scheduling conflict detection
- Bulk SMS campaign management
- Integration with existing pharmacy management systems

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables (see `env.example` for a template):

```env
# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=pharmacy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Backend
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h

# SMS
CAPCOM6_API_URL=http://100.126.232.47:8080
CAPCOM6_API_KEY=your_capcom6_api_key
CAPCOM6_ACCOUNT_ID=your_capcom6_account_id
CAPCOM6_PHONE_NUMBER=your_capcom6_phone_number

# Frontend
VITE_BACKEND_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## 📚 Documentation

- [Claude Project Guidelines](CLAUDE.md) - Comprehensive development guidelines
- [Local Memory & Context](CLAUDE.local.md) - Project context and decisions (contains credentials and sensitive information)
- Service-specific documentation in each service directory
 - Full Documentation Index: [docs/README.md](docs/README.md)

## 🤝 Contributing

1. Follow the project organization guidelines in `CLAUDE.md`
2. Use appropriate MCP servers for service-specific tasks
3. Write tests for all new features
4. Update documentation as needed
5. Follow the established naming conventions

## 📄 License

[License information to be added]

---

*This project is organized and maintained using Claude Code with MCP server integration for enhanced development capabilities.* 