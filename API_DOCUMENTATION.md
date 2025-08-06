# 🏥 Pharmacy Scheduling System - Complete API Documentation

**Version**: 1.0.0  
**Last Updated**: August 6, 2025  
**Environment**: Development/Production Ready

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Authentication & Security](#authentication--security)
3. [Network Configuration](#network-configuration)
4. [REST API Endpoints](#rest-api-endpoints)
5. [Edge Functions](#edge-functions)
6. [Webhook Configuration](#webhook-configuration)
7. [SMS Integration](#sms-integration)
8. [AI Chat Integration](#ai-chat-integration)
9. [Document Processing](#document-processing)
10. [Database Schema](#database-schema)
11. [Testing Procedures](#testing-procedures)
12. [Error Handling](#error-handling)
13. [Security Considerations](#security-considerations)
14. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 System Overview

### Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui (Port 3000)
- **Backend**: Self-hosted Supabase stack
  - **Database**: PostgreSQL (Port 5432)
  - **API Gateway**: Kong (Port 8002)
  - **REST API**: PostgREST (Port 3000 internal)
  - **Edge Functions**: Deno (Port 9000 internal)
  - **Realtime**: WebSocket server (Port 4000 internal)
  - **Storage**: File storage service (Port 5000 internal)
- **SMS Gateway**: Capcom6 Android Gateway (Port 8080)
- **AI Integration**: OpenRouter API with Qwen3 Coder model
- **Workflow Automation**: n8n (Port 5678)

### Core Services Status
- ✅ **REST API**: Fully operational
- ✅ **Edge Functions**: All functions working
- ✅ **SMS Integration**: Two-way communication active
- ✅ **AI Assistant**: OpenRouter integration working
- ✅ **Storage Service**: Document upload fully working
- ✅ **Realtime Service**: WebSocket subscriptions operational
- ❌ **Auth Service**: Minor issues (JWT auth working via API keys)

---

## 🔐 Authentication & Security

### API Keys
```bash
# Primary Authentication
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXJtLXNjaGVkdWxpbmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NDMxNjQyOSwiZXhwIjoxNzg1ODUyNDI5fQ.rFYSJjoH9jLAT-ifkQIprH5ORmpFQKkA27dohsf15NA"

SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXJtLXNjaGVkdWxpbmciLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU0MzE2NDI5LCJleHAiOjE3ODU4NTI0Mjl9.QuEJ2vEIO1AETW9j8QVSGgOqD1tVO270syautP7qs6M"

JWT_SECRET="fMvZdFHAkEW6HoWkKfj8IukvHEcn53344UcCMgLyD3o="
```

### Authentication Methods
1. **API Key Authentication**: Use `apikey` and `Authorization` headers
2. **JWT Tokens**: For user session management
3. **Row Level Security (RLS)**: Database-level access control

### Standard Headers
```bash
# For all API requests
apikey: {ANON_KEY}
Authorization: Bearer {ANON_KEY}
Content-Type: application/json
```

---

## 🌐 Network Configuration

### Service URLs

#### Local Development
```bash
Frontend:     http://localhost:3000
API Gateway:  http://localhost:8002
n8n:          http://localhost:5678
```

#### Tailscale Network Access
```bash
Server IP:    100.120.219.68
Capcom6 IP:   100.126.232.47

Frontend:     http://100.120.219.68:3000
API Gateway:  http://100.120.219.68:8002
Capcom6 SMS:  http://100.126.232.47:8080
n8n:          http://100.120.219.68:5678
```

### External Services
```bash
OpenRouter API:    https://openrouter.ai/api/v1/chat/completions
Capcom6 Password:  ciSEJNmY
OpenRouter Key:    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
```

---

## 📡 REST API Endpoints

### Base URL
```
http://100.120.219.68:8002/rest/v1/
```

### 👥 Contacts Management

#### List All Contacts
```bash
GET /rest/v1/contacts

# Example
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/contacts
```

#### Get Specific Contact
```bash
GET /rest/v1/contacts?id=eq.{contact_id}

# Example
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/contacts?id=eq.12345
```

#### Create New Contact
```bash
POST /rest/v1/contacts
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "priority": "medium",
  "status": "active",
  "notes": "New employee"
}

# Example
curl -X POST -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","phone":"+1234567890","email":"john@example.com","priority":"medium"}' \
     http://100.120.219.68:8002/rest/v1/contacts
```

#### Update Contact
```bash
PATCH /rest/v1/contacts?id=eq.{contact_id}
Content-Type: application/json

{
  "name": "John Doe Updated",
  "priority": "high"
}
```

#### Delete Contact
```bash
DELETE /rest/v1/contacts?id=eq.{contact_id}
```

### 💬 Messages Management

#### List All Messages
```bash
GET /rest/v1/messages?order=created_at.desc

# Filter by contact
GET /rest/v1/messages?contact_id=eq.{contact_id}&order=created_at.desc
```

#### Get Conversation History
```bash
GET /rest/v1/messages?contact_id=eq.{contact_id}&order=created_at.asc

# Example
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/messages?contact_id=eq.12345&order=created_at.asc
```

#### Create Message Record
```bash
POST /rest/v1/messages
Content-Type: application/json

{
  "contact_id": "12345",
  "content": "Hello, this is a test message",
  "direction": "outbound",
  "status": "pending",
  "ai_generated": false
}
```

### 🏪 Store Management

#### List All Stores
```bash
GET /rest/v1/stores?is_active=eq.true&order=store_number

# Example
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/stores
```

#### Get Store by Number
```bash
GET /rest/v1/stores?store_number=eq.1001

# Example
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/stores?store_number=eq.1001
```

#### Search Stores by City
```bash
GET /rest/v1/stores?city=ilike.*Springfield*&is_active=eq.true
```

### 📅 Schedule Management

#### List Store Schedules
```bash
GET /rest/v1/store_schedules?order=date.desc

# Filter by store
GET /rest/v1/store_schedules?store_number=eq.1001&order=date.desc

# Filter by date range
GET /rest/v1/store_schedules?date=gte.2025-08-01&date=lte.2025-08-31
```

#### Get Employee Schedule
```bash
GET /rest/v1/store_schedules?employee_name=eq.John%20Doe&order=date.desc

# Example
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     "http://100.120.219.68:8002/rest/v1/store_schedules?employee_name=eq.John%20Doe&order=date.desc"
```

#### Create Schedule Entry
```bash
POST /rest/v1/store_schedules
Content-Type: application/json

{
  "store_number": 1001,
  "date": "2025-08-15",
  "employee_name": "John Doe",
  "shift_time": "9:00 AM - 5:00 PM",
  "role": "Pharmacist",
  "scheduled_hours": 8.0
}
```

### 📋 Appointment Management

#### List Appointments
```bash
GET /rest/v1/appointments?order=appointment_date.desc

# Filter by contact
GET /rest/v1/appointments?contact_id=eq.{contact_id}

# Filter by status
GET /rest/v1/appointments?status=eq.pending
```

#### Create Appointment
```bash
POST /rest/v1/appointments
Content-Type: application/json

{
  "contact_id": "12345",
  "title": "Consultation",
  "description": "Annual review",
  "appointment_date": "2025-08-15",
  "appointment_time": "14:30:00",
  "duration_minutes": 30,
  "status": "pending"
}
```

---

## ⚡ Edge Functions

### Base URL
```
http://100.120.219.68:8002/functions/v1/
```

### 📨 SMS Functions

#### Send SMS (send-sms-v3)
**Endpoint**: `/functions/v1/send-sms-v3`  
**Method**: POST  
**Authentication**: Required (Bearer token)

```bash
POST /functions/v1/send-sms-v3
Authorization: Bearer {ANON_KEY}
Content-Type: application/json

{
  "contactId": "12345",
  "message": "Hello, this is a test message",
  "requiresAcknowledgment": false
}

# Example
curl -X POST -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contactId":"12345","message":"Hello from the pharmacy!","requiresAcknowledgment":false}' \
     http://100.120.219.68:8002/functions/v1/send-sms-v3
```

**Response**:
```json
{
  "success": true,
  "messageId": "uuid-message-id",
  "capcom6MessageId": "capcom6-id",
  "status": "sent",
  "contact": {
    "id": "12345",
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

#### SMS Webhook (capcom6-webhook)
**Endpoint**: `/functions/v1/capcom6-webhook`  
**Method**: POST  
**Authentication**: None (public webhook)

**Incoming Format**:
```json
{
  "event": "sms:received",
  "payload": {
    "message": "Hello back!",
    "phoneNumber": "+1234567890",
    "receivedAt": "2025-08-06T12:00:00Z"
  }
}
```

**Legacy Format Support**:
```json
{
  "id": "msg-id",
  "message": "Hello back!",
  "phone": "+1234567890",
  "received_at": "2025-08-06T12:00:00Z",
  "sim": 1
}
```

### 🤖 AI Chat Function

#### AI Chat Enhanced (ai-chat-enhanced)
**Endpoint**: `/functions/v1/ai-chat-enhanced`  
**Method**: POST  
**Authentication**: Required

```bash
POST /functions/v1/ai-chat-enhanced
Authorization: Bearer {ANON_KEY}
Content-Type: application/json

{
  "message": "Who is working at store 1001 today?",
  "user_id": "12345",
  "context": {
    "user_type": "management"
  }
}

# Example
curl -X POST -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"message":"Show me all employees scheduled for today","user_id":"12345"}' \
     http://100.120.219.68:8002/functions/v1/ai-chat-enhanced
```

**Response**:
```json
{
  "ai_response": "Based on the schedule data, here are the employees working today...",
  "data_results": [...],
  "available_sources": 5,
  "query_strategies": 4,
  "timestamp": "2025-08-06T12:00:00Z"
}
```

### 📄 Document Processing

#### Document Upload (document-upload)
**Endpoint**: `/functions/v1/document-upload`  
**Method**: POST  
**Authentication**: Required

```bash
POST /functions/v1/document-upload
Authorization: Bearer {ANON_KEY}
Content-Type: application/json

{
  "file_name": "pharmacy_data.xlsx",
  "file_type": "excel",
  "file_size": 1024000,
  "content": "base64-encoded-file-content",
  "metadata": {
    "description": "Monthly pharmacy data",
    "tags": ["schedules", "employees"],
    "priority": "high"
  }
}
```

**Response**:
```json
{
  "success": true,
  "import_id": "uuid-import-id",
  "message": "File uploaded successfully and processing started",
  "status": "pending",
  "processing_endpoint": "/functions/v1/process-excel"
}
```

### 🧪 Test Functions

#### Hello World Test (hello)
**Endpoint**: `/functions/v1/hello`  
**Method**: GET  
**Authentication**: Required

```bash
curl -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/functions/v1/hello
```

**Response**:
```json
"Hello from Edge Functions!"
```

---

## 🔗 Webhook Configuration

### Capcom6 SMS Gateway Setup

#### Webhook URL Configuration
```bash
# In Capcom6 Android App Settings
Webhook URL: http://100.120.219.68:8002/functions/v1/capcom6-webhook
Method: POST
Content-Type: application/json
```

#### Webhook Processing Flow
1. **Incoming SMS** received by Capcom6 Android app
2. **Webhook triggered** to `/functions/v1/capcom6-webhook`
3. **Contact lookup** or creation in database
4. **Message stored** in messages table
5. **AI processing** (if enabled for contact)
6. **Response sent** back via SMS (future feature)

#### Webhook Payload Formats

**New Format (Preferred)**:
```json
{
  "event": "sms:received",
  "payload": {
    "message": "User message content",
    "phoneNumber": "+1234567890",
    "receivedAt": "2025-08-06T12:00:00Z"
  }
}
```

**Legacy Format (Supported)**:
```json
{
  "id": "capcom6-message-id",
  "message": "User message content",
  "phone": "+1234567890", 
  "received_at": "2025-08-06T12:00:00Z",
  "sim": 1
}
```

---

## 📱 SMS Integration

### Capcom6 Gateway Configuration

#### Connection Details
```bash
Gateway URL:    http://100.126.232.47:8080
Username:       sms
Password:       ciSEJNmY
API Endpoint:   /messages
```

#### Send SMS via Capcom6
```bash
POST http://100.126.232.47:8080/messages
Authorization: Basic c21zOmNpU0VKTm1Z
Content-Type: application/json

{
  "message": "Hello from the pharmacy!",
  "phoneNumbers": ["+1234567890"],
  "sim": 1
}
```

#### SMS Status Tracking
- **pending**: Message queued for sending
- **sent**: Message sent to gateway
- **delivered**: Message delivered to recipient
- **failed**: Message failed to send
- **read**: Message marked as read (manual)

#### Message Metadata
```json
{
  "capcom_response": {
    "id": "capcom6-message-id",
    "recipients": [
      {
        "phone": "+1234567890",
        "state": "Sent",
        "error": null
      }
    ]
  },
  "received_at": "2025-08-06T12:00:00Z",
  "raw_payload": {...}
}
```

---

## 🤖 AI Chat Integration

### OpenRouter Configuration

#### API Details
```bash
Base URL:    https://openrouter.ai/api/v1/chat/completions
Model:       qwen/qwen3-coder:free
API Key:     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
```

#### AI System Capabilities
- **Data Source Access**: All database tables
- **Query Strategies**: REST API, SQL queries, SMS integration, n8n workflows
- **Context Awareness**: Employee schedules, store information, message history
- **Natural Language**: Conversational interface for complex queries

#### Example AI Interactions
```json
// Request
{
  "message": "Who is working at store 1001 tomorrow?",
  "user_id": "12345",
  "context": {
    "user_type": "management"
  }
}

// Response includes data query and formatted answer
{
  "ai_response": "Based on the schedule, the following employees are working at Store 1001 tomorrow:\n- John Doe (9 AM - 5 PM, Pharmacist)\n- Jane Smith (1 PM - 9 PM, Technician)",
  "data_results": [...schedule_data...],
  "timestamp": "2025-08-06T12:00:00Z"
}
```

---

## 📄 Document Processing

### Supported File Types
- **Excel**: .xlsx, .xls files
- **PDF**: Document extraction (planned)
- **CSV**: Comma-separated values

### Processing Workflow
1. **Upload**: File uploaded via `/functions/v1/document-upload`
2. **Validation**: File type, size, and format validation
3. **Storage**: Temporary base64 storage in database
4. **Processing**: Asynchronous processing via specialized functions
5. **Import**: Data mapping and database insertion
6. **Cleanup**: Temporary content removal

### Excel Processing Configuration
```json
{
  "sheets": ["Stores", "Employees", "Schedules"],
  "validation": {
    "required_columns": {
      "Stores": ["store_number", "address", "city", "state", "zip_code", "phone"],
      "Employees": ["name", "phone", "email"],
      "Schedules": ["store_number", "date", "employee_name", "shift_time"]
    }
  },
  "transformations": {
    "date_format": "YYYY-MM-DD",
    "phone_format": "standard"
  }
}
```

### Import Status Tracking
```bash
GET /rest/v1/document_imports?order=created_at.desc

# Example response
{
  "id": "uuid",
  "file_name": "pharmacy_data.xlsx", 
  "file_type": "excel",
  "status": "completed",
  "progress": 100,
  "message": "Successfully imported 150 records",
  "created_at": "2025-08-06T12:00:00Z"
}
```

---

## 🗄️ Database Schema

### Core Tables

#### contacts
```sql
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    notes TEXT,
    total_messages INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    ai_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### messages
```sql
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')) DEFAULT 'pending',
    capcom6_message_id TEXT,
    ai_generated BOOLEAN DEFAULT false,
    requires_acknowledgment BOOLEAN DEFAULT false,
    acknowledgment_code TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_message_id UUID REFERENCES messages(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### stores
```sql
CREATE TABLE stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_number INTEGER UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    pharmacy_hours TEXT,
    store_hours TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### store_schedules
```sql
CREATE TABLE store_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    store_number INTEGER NOT NULL,
    date DATE NOT NULL,
    employee_name TEXT NOT NULL,
    employee_id TEXT,
    role TEXT,
    employee_type TEXT,
    shift_time TEXT NOT NULL,
    scheduled_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### document_imports
```sql
CREATE TABLE document_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('excel', 'pdf', 'csv')),
    file_size INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    content TEXT, -- Base64 encoded file content (temporary storage)
    metadata JSONB DEFAULT '{}',
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sample Data
```sql
-- Sample stores
INSERT INTO stores (store_number, address, city, state, zip_code, phone) VALUES
(1001, '123 Main St', 'Springfield', 'IL', '62701', '217-555-0101'),
(1002, '456 Oak Ave', 'Springfield', 'IL', '62702', '217-555-0102'),
(1003, '789 Elm Blvd', 'Decatur', 'IL', '62521', '217-555-0103');

-- Sample contacts
INSERT INTO contacts (name, phone, email, priority) VALUES
('John Smith', '+1234567890', 'john.smith@pharmacy.com', 'high'),
('Jane Doe', '+1234567891', 'jane.doe@pharmacy.com', 'medium'),
('Mike Johnson', '+1234567892', 'mike.johnson@pharmacy.com', 'low'),
('Sarah Wilson', '+1234567893', 'sarah.wilson@pharmacy.com', 'medium');
```

---

## 🧪 Testing Procedures

### Environment Setup
```bash
# Load environment variables
source .env

# Test environment variables
echo "ANON_KEY: ${ANON_KEY:0:20}..."
echo "SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:0:20}..."
echo "API URL: http://100.120.219.68:8002"
```

### Health Checks

#### 1. Database Connection
```bash
# Test database connectivity
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/stores | jq '.[0]'
```

#### 2. Auth Service Check
```bash
# Test auth service
curl -sSf http://100.120.219.68:8002/auth/v1/verify | head -c 120
```

#### 3. Edge Functions Check
```bash
# Test hello function
curl -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/functions/v1/hello
```

### API Testing Scripts

#### Complete API Test Suite
```bash
#!/bin/bash
# api-test-suite.sh

source .env

echo "🏥 Pharmacy API Test Suite"
echo "========================="

# Test 1: Get all stores
echo "Test 1: Fetching stores..."
curl -s -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/stores | jq 'length'

# Test 2: Get all contacts
echo "Test 2: Fetching contacts..."
curl -s -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/contacts | jq 'length'

# Test 3: Send test SMS
echo "Test 3: Sending test SMS..."
curl -s -X POST -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contactId":"12345","message":"API Test Message","requiresAcknowledgment":false}' \
     http://100.120.219.68:8002/functions/v1/send-sms-v3 | jq '.success'

# Test 4: AI Chat test
echo "Test 4: Testing AI chat..."
curl -s -X POST -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"message":"List all stores","user_id":"test"}' \
     http://100.120.219.68:8002/functions/v1/ai-chat-enhanced | jq '.ai_response'

echo "✅ Test suite completed"
```

### Postman Collection

#### Collection Structure
```json
{
  "info": {
    "name": "Pharmacy Scheduling API",
    "description": "Complete API testing collection"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{ANON_KEY}}"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://100.120.219.68:8002"
    },
    {
      "key": "ANON_KEY", 
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ],
  "item": [
    {
      "name": "REST API",
      "item": [
        {
          "name": "Get All Stores",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/rest/v1/stores"
          }
        }
      ]
    }
  ]
}
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "apikey: $ANON_KEY" \
   -H "Authorization: Bearer $ANON_KEY" \
   http://100.120.219.68:8002/rest/v1/stores

# Using curl for webhook testing
for i in {1..10}; do
  curl -X POST -H "Content-Type: application/json" \
       -d '{"event":"sms:received","payload":{"message":"Test '$i'","phoneNumber":"+1234567890","receivedAt":"2025-08-06T12:00:00Z"}}' \
       http://100.120.219.68:8002/functions/v1/capcom6-webhook &
done
```

---

## ❌ Error Handling

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field",
    "message": "Field-specific error"
  }
}
```

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (missing/invalid API key)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate data)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Error Examples

#### Authentication Error
```json
{
  "code": "401",
  "error": "JWT expired",
  "message": "Invalid API key"
}
```

#### Validation Error
```json
{
  "code": "400", 
  "error": "Validation failed",
  "details": {
    "phone": "Phone number is required",
    "email": "Invalid email format"
  }
}
```

#### SMS Gateway Error
```json
{
  "success": false,
  "error": "Capcom6 service unavailable",
  "details": {
    "gateway_status": "offline",
    "retry_after": 60
  }
}
```

### Error Recovery Strategies

#### 1. Retry Logic
```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (attempt === maxRetries) throw new Error(`Failed after ${maxRetries} attempts`);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```

#### 2. Fallback Mechanisms
```javascript
// SMS fallback to direct database insert
async function sendSMSWithFallback(contactId, message) {
  try {
    // Try primary SMS function
    return await sendSMS(contactId, message);
  } catch (error) {
    // Fallback: Store message for manual processing
    return await createMessage({
      contact_id: contactId,
      content: message,
      direction: 'outbound',
      status: 'failed',
      notes: 'SMS gateway unavailable'
    });
  }
}
```

---

## 🔒 Security Considerations

### API Key Security
1. **Key Rotation**: Rotate API keys quarterly
2. **Environment Variables**: Never hardcode keys in source
3. **Access Levels**: Use appropriate key level (anon vs service_role)
4. **Monitoring**: Log all API key usage

### Row Level Security (RLS)
```sql
-- Example RLS policy
CREATE POLICY "Users can only see their own data" ON messages
  FOR ALL USING (auth.uid() = contact_id);

-- Allow anon access for testing
CREATE POLICY "Allow anon to view stores" ON stores 
  FOR SELECT USING (true);
```

### Network Security
1. **HTTPS**: Use TLS in production
2. **CORS**: Configure proper CORS headers
3. **Rate Limiting**: Implement rate limiting
4. **IP Whitelist**: Restrict access by IP (production)

### Data Protection
1. **PII Encryption**: Encrypt sensitive data
2. **Audit Logging**: Log all data access
3. **Data Retention**: Implement data cleanup policies
4. **HIPAA Compliance**: Healthcare data protection

### Webhook Security
```javascript
// Webhook signature verification
function verifyWebhookSignature(payload, signature, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(computed, 'hex')
  );
}
```

---

## 🛠️ Troubleshooting Guide

### Common Issues & Solutions

#### 1. Connection Refused Errors
```bash
# Symptom: curl: (7) Failed to connect to localhost:8002
# Solution: Check Docker services
docker compose ps
docker compose up -d

# Alternative: Use Tailscale IP
curl -H "apikey: $ANON_KEY" http://100.120.219.68:8002/rest/v1/stores
```

#### 2. Authentication Failures
```bash
# Symptom: 401 Unauthorized
# Solution: Verify API key
echo $ANON_KEY
source .env

# Test with correct headers
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/rest/v1/stores
```

#### 3. SMS Gateway Issues
```bash
# Check Capcom6 connectivity
ping 100.126.232.47

# Test direct Capcom6 API
curl -u sms:ciSEJNmY -X POST -H "Content-Type: application/json" \
     -d '{"message":"Test","phoneNumbers":["+1234567890"],"sim":1}' \
     http://100.126.232.47:8080/messages
```

#### 4. Database Connection Issues
```bash
# Check database container
docker compose exec db psql -U postgres -c "SELECT version();"

# Test PostgREST
curl http://100.120.219.68:8002/rest/v1/
```

#### 5. Edge Function Timeouts
```bash
# Check function logs
docker compose logs functions

# Test function directly
curl -H "Authorization: Bearer $ANON_KEY" \
     http://100.120.219.68:8002/functions/v1/hello
```

### Debugging Commands

#### Service Health Check
```bash
#!/bin/bash
# health-check.sh

echo "🔍 System Health Check"
echo "====================="

services=("db" "rest" "kong" "functions" "storage")

for service in "${services[@]}"; do
  status=$(docker compose ps $service --format "{{.State}}")
  echo "$service: $status"
done

echo ""
echo "API Endpoints:"
curl -s -o /dev/null -w "REST API: %{http_code}\n" \
  -H "apikey: $ANON_KEY" http://100.120.219.68:8002/rest/v1/stores

curl -s -o /dev/null -w "Functions: %{http_code}\n" \
  -H "Authorization: Bearer $ANON_KEY" http://100.120.219.68:8002/functions/v1/hello
```

#### Log Analysis
```bash
# View all service logs
docker compose logs --tail=50 -f

# Specific service logs
docker compose logs functions --tail=50 -f
docker compose logs kong --tail=50 -f

# Database query logs
docker compose exec db tail -f /var/log/postgresql/postgresql-*.log
```

### Performance Monitoring
```bash
# API response times
curl -w "@curl-format.txt" -s -o /dev/null \
  -H "apikey: $ANON_KEY" http://100.120.219.68:8002/rest/v1/stores

# Where curl-format.txt contains:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_total:       %{time_total}\n
```

### Emergency Procedures

#### 1. Service Recovery
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart functions

# Full system reset
docker compose down && docker compose up -d
```

#### 2. Database Recovery
```bash
# Apply schema manually
docker compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/migrations/01-pharmacy_schema.sql

# Check database integrity
docker compose exec db psql -U postgres -c "SELECT count(*) FROM contacts;"
```

#### 3. Rollback Procedures
```bash
# Git rollback to stable
git reset --hard stable-20250805-113741

# Docker image rollback
docker compose down
docker compose pull
docker compose up -d
```

---

## 📞 Support & Contact

### Development Team
- **Primary Contact**: System Administrator
- **Emergency Contact**: On-call support
- **Documentation**: This file (API_DOCUMENTATION.md)

### External Resources
- **Supabase Documentation**: https://supabase.com/docs
- **PostgREST API Reference**: https://postgrest.org/en/stable/
- **Capcom6 SMS Gateway**: https://github.com/capcom6/android-sms-gateway
- **OpenRouter API**: https://openrouter.ai/docs

---

## 📝 Changelog

### Version 1.0.0 (August 6, 2025)
- ✅ Complete API documentation
- ✅ All endpoints documented with examples
- ✅ Authentication and security guidelines
- ✅ Testing procedures and error handling
- ✅ Troubleshooting guide and debugging tools
- ✅ Database schema and sample data
- ✅ SMS integration and webhook configuration
- ✅ AI chat integration documentation

---

*This documentation is comprehensive and covers all aspects of the Pharmacy Scheduling System API. For updates or additional information, please refer to the project repository or contact the development team.*