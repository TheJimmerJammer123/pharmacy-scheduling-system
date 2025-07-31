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
- **SMS Gateway**: Capcom6 Android SMS Gateway (local server mode via Tailscale)
- **AI Integration**: Intelligent chatbot with SQL query capabilities
- **Containerization**: Docker with unified docker-compose.yml

## ✨ Core Features

### 📅 **Schedule Management**
- **Excel Import**: Load scheduling data from Excel files for all stores and employees
- **Multi-Store View**: Access and manage schedules across all pharmacy locations
- **Employee Database**: Comprehensive employee information and scheduling history
- **Real-time Updates**: Live schedule updates and notifications

### 💬 **SMS Communication**
- **Two-Way Messaging**: Send and receive SMS messages with employees
- **Message History**: Store and retrieve complete conversation history
- **Contact Management**: Organize employee contacts and communication preferences
- **Bulk Messaging**: Send notifications to multiple employees simultaneously

### 🤖 **AI Chatbot Integration**
- **Intelligent Assistant**: AI chatbot for scheduling queries and employee questions
- **SQL Query Capabilities**: Direct database access for real-time schedule information
- **Contextual Responses**: AI understands pharmacy scheduling context and terminology
- **Employee Support**: Automated responses to common scheduling questions

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
├── CLAUDE.md                    # Project guidelines and MCP server usage
├── CLAUDE.local.md              # Local memory and environment setup
├── docker-compose.yml           # Main Docker Compose configuration
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── frontend/                    # Frontend React application
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
├── scripts/                     # Project-wide utility scripts
└── volumes/                     # Legacy volume mounts (being phased out)
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
   - Frontend: [http://localhost:3000](http://localhost:3000) ✅
   - Supabase Studio: [http://localhost:3001](http://localhost:3001)
   - API Gateway: [http://localhost:8002](http://localhost:8002)

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
- **📱 Capcom6 SMS Gateway**: `100.126.232.47:8080` (via Tailscale)
  - Username: `sms`
  - Password: `ciSEJNmy`

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
CAPCOM6_URL=http://100.126.232.47:8080
CAPCOM6_USERNAME=sms
CAPCOM6_PASSWORD=ciSEJNmy
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