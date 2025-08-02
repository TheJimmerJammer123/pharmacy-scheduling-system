# Pharm Project

A comprehensive pharmacy scheduling and communication system designed for pharmacist schedulers to manage employee schedules, handle SMS communications, and interact with an AI chatbot for intelligent scheduling assistance.

## 🎯 Project Overview

This system enables pharmacist schedulers to:
- **Manage Employee Schedules**: Import and view scheduling data from Excel files across all stores and employees
- **SMS Communication**: Send, receive, and store SMS messages with employees using Capcom6 SMS Gateway
- **AI-Powered Assistance**: Chat with an intelligent AI bot that can query scheduling data and answer employee-related questions
- **Smart Conversation Management**: Toggle between AI chatbot and direct human communication for individual employee conversations
- **Multi-Store Support**: Access scheduling data for all pharmacy locations and employees

## 🏗️ Architecture

This project follows a service-oriented architecture with the following components:

- **Backend**: Supabase (PostgreSQL database, authentication, real-time features, API)
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **SMS Gateway**: Capcom6 Android SMS Gateway (local server mode via Tailscale) ✅ **OPERATIONAL**
- **Workflow Automation**: Self-hosted n8n for advanced automation and integrations
- **AI Integration**: Intelligent chatbot with SQL query capabilities (planned)
- **Containerization**: Docker with unified docker-compose.yml

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
pharm-project/
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
├── supabase/                    # Supabase self-hosted configuration
│   ├── volumes/                 # Docker volumes and configuration
│   │   ├── api/                 # API gateway config
│   │   ├── db/                  # Database initialization scripts
│   │   ├── functions/           # Edge functions
│   │   ├── logs/                # Logging configuration
│   │   ├── pooler/              # Connection pooler config
│   │   └── storage/             # File storage
│   ├── dev/                     # Development data and configs
│   └── README.md                # Supabase-specific documentation
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
   - Frontend: [http://localhost:3000](http://localhost:3000) ✅ **OPERATIONAL**
   - Supabase Studio: [http://localhost:3001](http://localhost:3001) ✅ **OPERATIONAL**
   - API Gateway (Kong): [http://localhost:8002](http://localhost:8002) ✅ **OPERATIONAL**
   - n8n Workflow Platform: [http://localhost:5678](http://localhost:5678) ✅ **OPERATIONAL**

## 🛠️ Development

### MCP Server Integration

This project uses Model Context Protocol (MCP) servers for enhanced development:

- **Context7 MCP**: General code understanding and analysis
- **Playwright MCP**: Frontend testing and debugging
- **Supabase MCP**: Backend service interaction and management

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
- **Backend**: Supabase testing tools and database testing

## 📦 Deployment

The project uses Docker for containerization and can be deployed using:

```bash
docker-compose -f docker-compose.yml up -d
```

## 🌐 Service Access

Once started, access these services:

### **Main Applications**
- **🌐 Frontend App**: [http://localhost:3000](http://localhost:3000)
- **📊 Supabase Studio**: [http://localhost:3001](http://localhost:3001)
  - Username: `supabase`
  - Password: `this_password_is_insecure_and_should_be_updated`

### **API Endpoints**
- **REST API**: `http://localhost:8002/rest/v1/`
- **Auth API**: `http://localhost:8002/auth/v1/`
- **Storage API**: `http://localhost:8002/storage/v1/`
- **Realtime API**: `http://localhost:8002/realtime/v1/`
- **Edge Functions**: `http://localhost:8002/functions/v1/`
- **Webhook**: `http://localhost:8002/functions/v1/capcom6-webhook`

### **Database Access**
- **Direct PostgreSQL**: `localhost:5433` (external connection)
- **Connection Pooler**: `localhost:6543` (transaction pooling)

### **External Services**
- **📱 Capcom6 SMS Gateway**: `100.126.232.47:8080` (via Tailscale) ✅ **OPERATIONAL**
  - Username: `sms`
  - Password: `ciSEJNmY`
  - **Documentation**: 
    - [Official Repository](https://github.com/capcom6/android-sms-gateway)
    - [API Specification](https://capcom6.github.io/android-sms-gateway/)
  - **Webhook URL**: `https://webhook.jammer-industries.com/functions/v1/capcom6-webhook`
  - **Status**: ✅ Sending and receiving SMS with real-time updates

## 📋 Current System Status

### ✅ **Fully Operational Components**
- **🐳 Docker Services**: All containers running healthy
- **🗃️ Database**: PostgreSQL with complete pharmacy schema and real-time replication
- **🌐 REST API**: PostgREST endpoints fully functional at port 8002
- **⚛️ Frontend**: React app with hot reload development environment
- **📱 SMS Integration**: Complete two-way SMS communication via Capcom6
  - **Outbound**: Send messages via Edge Functions
  - **Inbound**: Webhook receiving with real-time updates
  - **UI**: Auto-scroll to new messages, smart notifications
- **🤖 AI Assistant**: Basic chatbot integration with OpenRouter API
  - **Natural Conversations**: GPT-3.5-turbo powered responses
  - **Pharmacy Context**: Understanding of pharmacy operations
  - **Real-time Chat**: Instant responses with message history
- **🔄 Real-time Updates**: Live message synchronization between devices
- **⚙️ Workflow Automation**: n8n platform with MCP AI assistance
- **🔐 Authentication**: Both anonymous and service role access working

### 🚧 **In Development**
- **📊 Excel Import**: Schedule data import functionality
- **🔍 Advanced AI**: SQL query capabilities for AI chatbot (basic version complete)
- **📈 Advanced Analytics**: Comprehensive reporting and insights

### 🎯 **Next Priority Features**
- Employee onboarding automation via n8n workflows
- Advanced scheduling conflict detection
- Bulk SMS campaign management
- Integration with existing pharmacy management systems

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=http://localhost:8002
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Frontend Configuration (injected via Docker Compose)
VITE_SUPABASE_URL=http://localhost:8002
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration
DATABASE_URL=postgres://postgres:your-super-secret-and-long-postgres-password@localhost:5433/postgres

# Capcom6 SMS Gateway
# Documentation: https://github.com/capcom6/android-sms-gateway
CAPCOM6_URL=http://100.126.232.47:8080
CAPCOM6_USERNAME=sms
CAPCOM6_PASSWORD=ciSEJNmY
```

## 📚 Documentation

- [Claude Project Guidelines](CLAUDE.md) - Comprehensive development guidelines
- [Local Memory & Context](CLAUDE.local.md) - Project context and decisions
- Service-specific documentation in each service directory

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