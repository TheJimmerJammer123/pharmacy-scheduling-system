# 🔥 API Reference - Pharmacy Scheduling System

**Base URL**: `http://localhost:3001/api` (Development) | `http://100.120.219.68:3001/api` (Tailscale)

**Version**: 2.0.0

**Authentication**: Bearer Token (JWT)

---

## 🚀 **Quick Start**

### Authentication
All API endpoints (except `/health`) require authentication using JWT Bearer tokens.

```bash
# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/contacts
```

---

## 🔐 **Authentication Endpoints**

### POST `/auth/login`
Authenticate user and receive JWT token.

**Rate Limit**: 5 attempts per 15 minutes

```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@pharmacy.com",
    "role": "admin"
  }
}
```

### POST `/auth/register`
Register new user account.

**Rate Limit**: 3 registrations per hour

```bash
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"newuser",
    "email":"user@example.com",
    "password":"securepass123",
    "role":"employee"
  }'
```

### GET `/auth/me`
Get current user information.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" /api/auth/me
```

### POST `/auth/logout`
Logout current user (revoke tokens).

### POST `/auth/change-password`
Change user password.

```bash
curl -X POST /api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword":"oldpass",
    "newPassword":"newpass123"
  }'
```

---

## 👥 **Contact Management**

### GET `/contacts`
Retrieve contacts with optional filtering.

**Query Parameters:**
- `status`: Filter by status (`active`, `inactive`)
- `priority`: Filter by priority (`low`, `medium`, `high`)
- `search`: Search across name, phone, email
- `limit`: Results per page (default: 100, max: 100)
- `offset`: Pagination offset (default: 0)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "/api/contacts?status=active&limit=50"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "status": "active",
    "priority": "high",
    "notes": "Important contact",
    "message_count": "5",
    "appointment_count": "2",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

### POST `/contacts`
Create new contact.

```bash
curl -X POST /api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "phone": "+1234567891",
    "email": "jane@example.com",
    "priority": "medium",
    "notes": "New employee"
  }'
```

### PUT `/contacts/{id}`
Update existing contact.

```bash
curl -X PUT /api/contacts/uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith Updated",
    "status": "inactive"
  }'
```

### DELETE `/contacts/{id}`
Delete contact and associated data.

---

## 💬 **Messaging**

### GET `/messages`
Get all messages with pagination.

**Query Parameters:**
- `limit`: Results per page (default: 100)
- `offset`: Pagination offset (default: 0)
- `direction`: Filter by direction (`inbound`, `outbound`)
- `status`: Filter by status (`pending`, `sent`, `delivered`, `failed`)

### GET `/messages/{contactId}`
Get messages for specific contact.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "/api/messages/uuid?limit=50&offset=0"
```

### POST `/send-sms`
Send SMS message via Capcom6 gateway (Local Server mode at `http://100.126.232.47:8080`).

**Rate Limit**: 10 SMS per 5 minutes

```bash
curl -X POST /api/send-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from Pharmacy!",
    "contactId": "uuid"
  }'
```

**Response:**
```json
{
  "id": "msg_123",
  "to": "+1234567890",
  "from": "+1234567000",
  "message": "Hello from Pharmacy!",
  "status": "sent",
  "timestamp": "2023-01-01T00:00:00Z",
  "contactId": "uuid"
}
```

### DELETE `/messages/{id}`
Delete message record.

---

## 📅 **Schedule Management**

### GET `/schedule-entries`
Get schedule entries with filtering.

**Query Parameters:**
- `employee_name`: Filter by employee name
- `store_number`: Filter by store number
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `limit`: Results per page (default: 100)
- `offset`: Pagination offset

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "/api/schedule-entries?store_number=1001&date_from=2023-01-01"
```

### POST `/schedule-entries`
Create new schedule entry.

```bash
curl -X POST /api/schedule-entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_number": 1001,
    "date": "2023-01-01",
    "employee_name": "John Doe",
    "shift_time": "9:00 AM - 5:00 PM",
    "notes": "Regular shift"
  }'
```

### PUT `/schedule-entries/{id}`
Update schedule entry.

### DELETE `/schedule-entries/{id}`
Delete schedule entry.

---

## 🏪 **Store Management**

### GET `/stores`
Get all active stores.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" /api/stores
```

**Response:**
```json
[
  {
    "id": "uuid",
    "store_number": 1001,
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip_code": "90210",
    "phone": "555-0101",
    "pharmacy_hours": "9:00 AM - 6:00 PM",
    "store_hours": "8:00 AM - 9:00 PM",
    "is_active": true
  }
]
```

---

## 📊 **Statistics & Analytics**

### GET `/stats/dashboard`
Get comprehensive dashboard statistics.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" /api/stats/dashboard
```

**Response:**
```json
{
  "contacts": {
    "total": "150",
    "active": "120",
    "high_priority": "25"
  },
  "messages": {
    "total": "1500",
    "today": "45",
    "pending": "5",
    "ai_generated": "200"
  },
  "schedule": {
    "total_entries": "500",
    "today_entries": "12",
    "active_stores": "5"
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

---

## 🔧 **System Monitoring**

### GET `/health`
System health check (public endpoint).

```bash
curl /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00Z",
  "uptime": "5m 30s",
  "database": "healthy",
  "sms": "connected",
  "services": ["postgres", "sms", "socket"],
  "memory": {
    "used": "125MB",
    "total": "512MB"
  }
}
```

### GET `/metrics` 🔒 *Admin Only*
Detailed system metrics and performance data.

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" /api/metrics
```

**Response includes:**
- Request statistics
- Performance metrics
- Database statistics
- SMS gateway metrics
- Authentication metrics
- System resources

---

## 🚨 **Webhooks**

### POST `/webhooks/capcom6`
Webhook endpoint for Capcom6 SMS delivery receipts (Capcom6 device posts here).

**Expected Payload:**
```json
{
  "message_id": "msg_123",
  "status": "delivered",
  "to": "+1234567890",
  "timestamp": "2023-01-01T00:00:00Z",
  "contact_id": "uuid"
}
```

---

## 📡 **Real-time Events (Socket.IO)**

### Connection
Connect to Socket.IO server for real-time updates.

```javascript
const socket = io('http://localhost:3001');

// Join contact room for updates
socket.emit('join_contact', 'contact-uuid');

// Listen for SMS events
socket.on('sms_sent', (data) => {
  console.log('SMS sent:', data);
});

socket.on('sms_delivery_update', (data) => {
  console.log('Delivery update:', data);
});
```

### Events
- `sms_sent`: SMS message sent successfully
- `sms_delivery_update`: SMS delivery status update

---

## ❌ **Error Handling**

### Error Response Format
```json
{
  "error": "Error message",
  "type": "ERROR_TYPE",
  "timestamp": "2023-01-01T00:00:00Z",
  "requestId": "req_123"
}
```

### Common Error Types
- `VALIDATION_ERROR`: Input validation failed
- `AUTH_ERROR`: Authentication failed
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `RESOURCE_NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `SMS_ERROR`: SMS sending failed

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## 🛡️ **Security**

### Rate Limits
- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 registrations per hour
- **SMS**: 10 messages per 5 minutes
- **API General**: 100 requests per minute

### Authentication
- JWT tokens expire after 24 hours (configurable)
- Tokens include user ID, username, and role
- Admin endpoints require `admin` role

### Input Validation
- All inputs are sanitized and validated
- UUID format validation for IDs
- Email and phone number format validation
- Message length limits (1600 characters for SMS)

---

## 🚀 **Performance**

### Caching
- Database connection pooling (20 connections)
- Query result caching for dashboard statistics
- Response time monitoring

### Pagination
- Default page size: 50-100 items
- Maximum page size: 100 items
- Offset-based pagination

### Monitoring
- Request/response time tracking
- Error rate monitoring
- Database query performance
- Memory and CPU usage tracking

---

## 📝 **Examples**

### Complete Contact Workflow
```bash
# 1. Login
TOKEN=$(curl -s -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  jq -r '.token')

# 2. Create contact
CONTACT_ID=$(curl -s -X POST /api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"+1234567890"}' | \
  jq -r '.id')

# 3. Send SMS
curl -X POST /api/send-sms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"+1234567890\",\"message\":\"Welcome!\",\"contactId\":\"$CONTACT_ID\"}"

# 4. Check messages
curl -H "Authorization: Bearer $TOKEN" \
  "/api/messages/$CONTACT_ID"
```

---

## 🆘 **Support**

For API support and questions:
- Check system logs: `docker compose logs backend`
- Monitor health: `GET /api/health`  
- View metrics: `GET /api/metrics` (admin only)
- Review documentation: `/docs/api/`

**Rate Limiting**: If you exceed rate limits, wait for the time window to reset or contact an administrator to increase limits.