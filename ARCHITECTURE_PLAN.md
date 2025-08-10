# Pharmacy Scheduling System - Simplified Architecture Plan

## Overview
We've simplified our architecture by removing all Supabase dependencies and implementing a pure Node.js + PostgreSQL stack. This provides better control, simpler deployment, and eliminates vendor lock-in.

## New Architecture

### Core Services
1. **Frontend** (React + TypeScript)
   - Port: 3000
   - Direct communication with backend via REST API
   - Real-time updates via Socket.IO
   - No external API dependencies

2. **Backend** (Node.js + Express + Socket.IO)
   - Port: 3001
   - Handles all business logic
   - SMS integration via Capcom6 API (Local Server mode over Tailscale)
   - Real-time communication via Socket.IO
   - Direct PostgreSQL database access

3. **Database** (PostgreSQL)
   - Port: 5432
   - Stores all application data
   - No external service dependencies

4. **N8N** (Workflow Automation)
   - Port: 5678
   - Handles complex business workflows
   - Integrates with backend via API calls

## What We Removed

### Supabase Components (No Longer Needed)
- ❌ **Supabase Auth** - Replaced with custom backend authentication
- ❌ **Supabase Edge Functions** - Replaced with Express routes
- ❌ **Supabase Realtime** - Replaced with Socket.IO
- ❌ **Supabase Storage** - Not needed for current features
- ❌ **Kong API Gateway** - Backend handles routing directly
- ❌ **PostgREST** - Backend connects to PostgreSQL directly

## Benefits of New Architecture

### 1. **Simplified Stack**
- Fewer moving parts
- Easier debugging and maintenance
- Reduced complexity in deployment

### 2. **Better Control**
- Full control over API endpoints
- Custom authentication logic
- Flexible real-time implementation

### 3. **Cost Reduction**
- No Supabase subscription costs
- Self-hosted PostgreSQL
- Predictable infrastructure costs

### 4. **Performance**
- Direct database connections
- No API gateway overhead
- Optimized for our specific use case

## API Endpoints

### SMS Operations
- `POST /api/send-sms` - Send SMS via Capcom6
- `POST /api/webhooks/capcom6` - Receive delivery receipts

### Data Operations
- `GET /api/messages/:contactId` - Get messages for a contact
- `GET /api/contacts` - Get all contacts
- `GET /api/health` - Health check

### Real-time Events (Socket.IO)
- `sms_sent` - Emitted when SMS is sent
- `sms_delivery_update` - Emitted when delivery status changes

## Database Schema
The backend will directly manage the PostgreSQL schema, including:
- Users and authentication
- Contacts and messages
- SMS delivery tracking
- Application settings

## Environment Variables

### Backend
```env
# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=pharmacy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# SMS Gateway
CAPCOM6_API_URL=http://100.126.232.47:8080
CAPCOM6_USERNAME=sms
CAPCOM6_PASSWORD=your_password
# Optional
CAPCOM6_API_KEY=your_api_key
CAPCOM6_ACCOUNT_ID=your_account_id
CAPCOM6_PHONE_NUMBER=your_phone_number

# Server
BACKEND_PORT=3001
NODE_ENV=production
```

### Frontend
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## Deployment

### Local Development
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f [service_name]

# Stop services
docker compose down
```

### Production Considerations
- Use environment-specific `.env` files
- Implement proper logging and monitoring
- Set up database backups
- Configure reverse proxy (nginx) if needed
- Use PM2 or similar for process management

## Migration Steps

### 1. **Database Migration**
- Export existing data from Supabase
- Import to new PostgreSQL instance
- Update schema if needed

### 2. **Authentication Migration**
- Implement custom auth in backend
- Migrate user accounts
- Update frontend auth logic

### 3. **API Migration**
- Update frontend API calls
- Test all endpoints
- Verify real-time functionality

### 4. **Testing**
- Unit tests for backend
- Integration tests for SMS
- End-to-end testing

## Future Enhancements

### Potential Additions
- Redis for caching
- Message queue (RabbitMQ/Redis)
- File upload service
- Advanced analytics
- Multi-tenant support

### Scaling Considerations
- Load balancing for backend
- Database read replicas
- Horizontal scaling with containers
- CDN for static assets

## Security Considerations

### Backend Security
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js for security headers
- Environment variable protection

### Database Security
- Connection encryption
- User permission restrictions
- Regular security updates
- Backup encryption

## Monitoring and Logging

### Backend Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- Request logging

### Database Monitoring
- Connection pool status
- Query performance
- Disk usage
- Backup status

## Conclusion

This simplified architecture provides:
- **Better control** over our application
- **Reduced complexity** in deployment and maintenance
- **Cost savings** from removing vendor dependencies
- **Improved performance** through direct connections
- **Easier debugging** and development

The migration to this architecture will result in a more maintainable, scalable, and cost-effective system while preserving all existing functionality.
