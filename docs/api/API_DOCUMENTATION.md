# 🏥 Pharmacy Scheduling System - API Documentation

**Version**: 2.0.0  
**Last Updated**: August 10, 2025  
**Architecture**: Node.js + PostgreSQL + Socket.IO

## 🎯 Overview

This API documentation covers the new simplified architecture featuring:
- **Node.js + Express** backend with JWT authentication
- **Socket.IO** for real-time features
- **Direct PostgreSQL** database connection
- **RESTful API** endpoints for all pharmacy operations

## 🏗️ Architecture

```
Frontend (React)  →  Backend API (Node.js)  →  Database (PostgreSQL)
Port: 3000           Port: 3001              Port: 5432
                         ↓
                    Socket.IO Server
                    (Real-time features)
```

## 🌐 Base URLs

### Local Development
- **Backend API**: `http://localhost:3001/api`
- **Socket.IO**: `http://localhost:3001`

### Tailscale Network
- **Backend API**: `http://100.120.219.68:3001/api`
- **Socket.IO**: `http://100.120.219.68:3001`

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication with bcrypt password hashing.

### Authentication Flow
1. Login with username/password to receive JWT token
2. Include token in `Authorization: Bearer {token}` header
3. Token expires in 24 hours (configurable)

### Standard Request Headers
```bash
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

## 📡 API Endpoints

### 🔐 Authentication

#### POST /api/auth/login
Authenticate user and receive JWT token.

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@pharmacy.com",
    "role": "admin"
  }
}
```

#### POST /api/auth/register
Register new user account.

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@pharmacy.com",
    "password": "securepassword123",
    "role": "employee"
  }'
```

#### GET /api/auth/me
Get current user information (requires authentication).

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

#### POST /api/auth/logout
Logout user (client should discard token).

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 🏥 System Health

#### GET /api/health
Check system health and service status.

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-10T12:00:00.000Z",
  "database": "connected",
  "services": ["postgres", "sms", "socket"]
}
```

### 👥 Contacts Management

#### GET /api/contacts
List all contacts with optional filtering.

```bash
# List all contacts
curl http://localhost:3001/api/contacts \
  -H "Authorization: Bearer {JWT_TOKEN}"

# With filters
curl "http://localhost:3001/api/contacts?status=active&priority=high&search=john" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Query Parameters:**
- `status`: active, inactive
- `priority`: low, medium, high  
- `search`: Search in name, phone, or email

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+15551234567",
    "email": "john.doe@pharmacy.com",
    "status": "active",
    "priority": "high",
    "message_count": 25,
    "appointment_count": 3,
    "created_at": "2025-08-01T10:00:00Z"
  }
]
```

### 💬 Messages & SMS

#### GET /api/messages/:contactId
Get message history for a contact.

```bash
curl http://localhost:3001/api/messages/12345 \
  -H "Authorization: Bearer {JWT_TOKEN}"

# With pagination
curl "http://localhost:3001/api/messages/12345?limit=50&offset=0" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "contact_id": "12345",
    "content": "Hello, this is a test message",
    "direction": "outbound",
    "status": "delivered",
    "capcom6_message_id": "cap_123",
    "created_at": "2025-08-10T14:30:00Z",
    "contact_name": "John Doe",
    "contact_phone": "+15551234567"
  }
]
```

#### POST /api/send-sms
Send SMS message to a contact.

```bash
curl -X POST http://localhost:3001/api/send-sms \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "message": "Hello from the pharmacy!",
    "contactId": "12345"
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "to": "+15551234567",
  "from": "+15559876543",
  "message": "Hello from the pharmacy!",
  "status": "sent",
  "timestamp": "2025-08-10T14:30:00Z",
  "contactId": "12345",
  "dbId": "uuid"
}
```

#### POST /api/webhooks/capcom6
Webhook endpoint for Capcom6 SMS delivery receipts (public endpoint).

```bash
# This endpoint is called by Capcom6, not by your application
POST http://localhost:3001/api/webhooks/capcom6
Content-Type: application/json

{
  "message_id": "cap_123",
  "status": "delivered", 
  "to": "+15551234567",
  "timestamp": "2025-08-10T14:31:00Z"
}
```

### 🏪 Store Management

#### GET /api/stores
List all active stores.

```bash
curl http://localhost:3001/api/stores \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "store_number": 1001,
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip_code": "62701",
    "phone": "217-555-0101",
    "pharmacy_hours": "9:00 AM - 6:00 PM",
    "store_hours": "8:00 AM - 9:00 PM",
    "is_active": true
  }
]
```

### 📅 Appointments

#### GET /api/appointments
List appointments with optional filtering.

```bash
# List all appointments
curl http://localhost:3001/api/appointments \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Filter by contact
curl "http://localhost:3001/api/appointments?contactId=12345" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Filter by date and status  
curl "http://localhost:3001/api/appointments?date=2025-08-10&status=pending" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "contact_id": "12345",
    "title": "Consultation",
    "description": "Annual review",
    "appointment_date": "2025-08-15",
    "appointment_time": "14:30:00",
    "duration_minutes": 30,
    "status": "pending",
    "contact_name": "John Doe",
    "contact_phone": "+15551234567"
  }
]
```

## 🔌 Real-time Features (Socket.IO)

The system uses Socket.IO for real-time communication.

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Events

#### Join Contact Room
Join a contact-specific room to receive real-time updates.

```javascript
socket.emit('join_contact', contactId);
```

#### Leave Contact Room
Leave a contact-specific room.

```javascript
socket.emit('leave_contact', contactId);
```

#### SMS Sent Event
Triggered when an SMS is successfully sent.

```javascript
socket.on('sms_sent', (data) => {
  console.log('SMS sent:', data);
  // {
  //   id: 'uuid',
  //   to: '+15551234567',
  //   message: 'Hello!',
  //   status: 'sent',
  //   contactId: '12345'
  // }
});
```

#### SMS Delivery Update
Triggered when SMS delivery status changes.

```javascript
socket.on('sms_delivery_update', (data) => {
  console.log('SMS delivery update:', data);
  // {
  //   messageId: 'cap_123',
  //   status: 'delivered',
  //   to: '+15551234567',
  //   timestamp: '2025-08-10T14:31:00Z'
  // }
});
```

## 📱 SMS Integration

### Capcom6 Gateway (Local Server mode)
- **Gateway URL**: `http://100.126.232.47:8080` (Android device on Tailscale)
- **Webhook URL**: `http://100.120.219.68:3001/api/webhooks/capcom6`

### SMS Flow
1. **Outbound**: Frontend → Backend API → Capcom6 → SMS Network
2. **Inbound**: SMS Network → Capcom6 → Webhook → Backend → Real-time update

### Message Status Tracking
- `pending`: Message queued for sending
- `sent`: Message sent to gateway
- `delivered`: Message delivered to recipient  
- `failed`: Message failed to send
- `read`: Message marked as read (manual)

## 🤖 AI Chat

### POST /api/ai/chat
Send a chat prompt to the AI assistant. If `OPENROUTER_API_KEY` is not configured, service responds with a mock message (modular development mode).

Request:
```json
{
  "message": "Summarize today’s schedule",
  "userRole": "manager",
  "context": [
    { "role": "system", "content": "Use concise bullets" }
  ]
}
```

Response (example):
```json
{
  "response": "...",
  "model": "openai/gpt-4o-mini",
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

## 🗄️ Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### contacts  
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    notes TEXT,
    total_messages INTEGER DEFAULT 0,
    ai_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id),
    content TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'inbound' or 'outbound'
    status TEXT DEFAULT 'pending',
    capcom6_message_id TEXT,
    ai_generated BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Authentication Test
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# Use token
curl http://localhost:3001/api/contacts \
  -H "Authorization: Bearer $TOKEN"
```

### SMS Test
```bash
curl -X POST http://localhost:3001/api/send-sms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "message": "Test message from API",
    "contactId": "12345"
  }'
```

## ⚠️ Error Handling

### Standard Error Format
```json
{
  "error": "Error message description",
  "details": "Additional error details"
}
```

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Authentication Errors
- **Invalid credentials**: Username/password incorrect
- **Token expired**: JWT token has expired
- **Invalid token**: JWT token is malformed
- **Account inactive**: User account is disabled

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API endpoint rate limiting
- **Role-based Access**: Admin, manager, employee roles

### Security Headers
- **Helmet.js**: Security headers middleware
- **CORS**: Cross-origin request protection
- **Input Validation**: All input validated and sanitized

## 🚀 Development

### Environment Variables
```bash
# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=pharmacy
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# JWT Authentication  
JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum
JWT_EXPIRY=24h

# SMS Gateway (Capcom6)
CAPCOM6_API_URL=http://100.126.232.47:8080
CAPCOM6_API_KEY=your_api_key
CAPCOM6_PHONE_NUMBER=+15559876543

# Server
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Starting the System
```bash
# Start all services
docker compose up -d

# View logs  
docker compose logs -f backend

# Test API
curl http://localhost:3001/api/health
```

---

**Documentation Complete** ✅  
*For the simplified Node.js + PostgreSQL architecture*

