# 🚀 Development Guide - Pharmacy Scheduling System

This guide covers development workflows, architecture decisions, and best practices for contributing to the Pharmacy Scheduling System.

## 📋 **Table of Contents**

- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Strategy](#testing-strategy)
- [Security Guidelines](#security-guidelines)
- [Performance Optimization](#performance-optimization)
- [Debugging & Troubleshooting](#debugging--troubleshooting)

---

## 🛠️ **Development Setup**

### Prerequisites
- **Docker** & **Docker Compose**: For containerized development
- **Node.js 18+**: For local development
- **Git**: Version control
- **VSCode** (recommended): With suggested extensions

### Quick Start
```bash
# Clone the repository
git clone https://github.com/TheJimmerJammer123/pharmacy-scheduling-system.git
cd pharmacy-scheduling-system

# Copy environment configuration
cp env.example .env
# Edit .env with your specific values

# Start all services
docker compose up -d

# Check service health
docker compose ps
curl http://localhost:3001/api/health
```

### Development Services
- **Frontend**: http://localhost:3000 (React + Vite)
- **Backend**: http://localhost:3001 (Node.js + Express)
- **Database**: localhost:5432 (PostgreSQL)
- **n8n Automation**: http://localhost:5678

### Tailscale Access (Mobile Development)
- **Frontend**: http://100.120.219.68:3000
- **Backend**: http://100.120.219.68:3001
- **Capcom6 SMS (Local Server mode)**: http://100.126.232.47:8080

---

## 🏗️ **Architecture Overview**

### System Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │────│   Backend   │────│  Database   │
│  React/TS   │    │ Node.js/Exp │    │ PostgreSQL  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   
       │            ┌─────────────┐            
       │            │ SMS Gateway │            
       └────────────│  Capcom6    │            
                    └─────────────┘            
```

### Backend Architecture (Service Layer Pattern)
```
backend/
├── server.js                 # Main application entry
├── middleware/               # Express middleware
│   ├── errorHandler.js      # Error handling & logging
│   ├── security.js          # Security policies
│   ├── validation.js        # Input validation
│   └── monitoring.js        # Performance metrics
├── services/                # Business logic layer
│   ├── authService.js       # Authentication logic
│   ├── contactService.js    # Contact management
│   ├── messageService.js    # Message handling
│   ├── smsService.js        # SMS gateway integration
│   ├── scheduleService.js   # Schedule management
│   └── databaseService.js   # Database connection
├── db/init/                 # Database migrations
└── tests/                   # Test suites
```

### Frontend Architecture
```
frontend/src/
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   └── [feature]/          # Feature-specific components
├── hooks/                  # Custom React hooks
├── services/              # API service layer
├── lib/                   # Utilities & helpers
├── types/                 # TypeScript definitions
└── pages/                 # Route components
```

---

## 🔄 **Development Workflow**

### Feature Development Process
1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Development**
   - Follow code standards and conventions
   - Write tests for new functionality
   - Update documentation as needed

3. **Testing**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests  
   cd frontend && npm test
   
   # Integration testing
   docker compose up -d
   # Manual testing of critical paths
   ```

4. **Code Quality**
   ```bash
   # Linting
   npm run lint
   
   # Type checking
   npm run type-check
   
   # Format code
   npm run format
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add user notification system"
   git push origin feature/your-feature-name
   ```

6. **Pull Request**
   - Create PR against `main` branch
   - Automated CI/CD checks must pass
   - Code review required
   - Staging deployment for testing

### Git Workflow
- **main**: Production-ready code
- **feature/**: Feature development branches
- **hotfix/**: Critical production fixes
- **release/**: Release preparation branches

### Commit Message Convention
```
feat: add new feature
fix: fix bug in existing feature
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

---

## 📏 **Code Standards**

### Backend (Node.js)
```javascript
// Use async/await instead of callbacks
const getData = async () => {
  try {
    const result = await db.query('SELECT * FROM contacts');
    return result.rows;
  } catch (error) {
    logger.error('Database error', { error: error.message });
    throw error;
  }
};

// Use service layer for business logic
class ContactService {
  async createContact(data) {
    // Validation
    // Business logic
    // Database operations
    // Logging
  }
}

// Proper error handling
app.use(asyncHandler(async (req, res) => {
  const result = await contactService.getAllContacts();
  res.json(result);
}));
```

### Frontend (React/TypeScript)
```tsx
// Use TypeScript interfaces
interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
}

// Functional components with hooks
const ContactList: React.FC<{ contacts: Contact[] }> = ({ contacts }) => {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="contact-list">
      {contacts.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
};

// Custom hooks for business logic
const useContacts = () => {
  return useQuery(['contacts'], () => apiService.getContacts());
};
```

### Database
```sql
-- Use descriptive table and column names
CREATE TABLE schedule_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_number INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    shift_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add proper indexes
CREATE INDEX idx_schedule_entries_store_date 
ON schedule_entries(store_number, date);

-- Use comments for complex queries
-- Get contacts with message counts for dashboard
SELECT c.*, COUNT(m.id) as message_count
FROM contacts c
LEFT JOIN messages m ON c.id = m.contact_id
GROUP BY c.id;
```

---

## 🧪 **Testing Strategy**

### Backend Testing
```javascript
// Unit tests for services
describe('ContactService', () => {
  it('should create contact with valid data', async () => {
    const contactData = {
      name: 'Test User',
      phone: '+1234567890'
    };
    
    const result = await contactService.createContact(contactData);
    
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test User');
  });
});

// Integration tests for APIs
describe('GET /api/contacts', () => {
  it('should return contacts for authenticated user', async () => {
    const response = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(response.body).toBeInstanceOf(Array);
  });
});
```

### Frontend Testing
```tsx
// Component tests
test('renders contact list', () => {
  const contacts = [
    { id: '1', name: 'John Doe', phone: '+1234567890', status: 'active' }
  ];
  
  render(<ContactList contacts={contacts} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

// Hook tests
test('useContacts fetches contacts', async () => {
  const { result } = renderHook(() => useContacts());
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

### Testing Commands
```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Frontend tests
cd frontend  
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Integration tests
docker compose up -d
npm run test:integration
```

---

## 🛡️ **Security Guidelines**

### Authentication & Authorization
```javascript
// Always validate JWT tokens
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const decoded = await authService.verifyToken(token);
    req.user = await authService.getUserById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Role-based access control
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### Input Validation
```javascript
// Validate all inputs
const validateContact = (req, res, next) => {
  const { name, phone, email } = req.body;
  const errors = [];
  
  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (phone && !validatePhoneFormat(phone)) {
    errors.push('Invalid phone format');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      validation_errors: errors 
    });
  }
  
  next();
};
```

### Security Checklist
- [ ] All endpoints require authentication (except health)
- [ ] Input validation on all user data
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting on sensitive endpoints
- [ ] Secure headers (Helmet.js)
- [ ] Environment secrets not in code
- [ ] Audit logging for sensitive operations

---

## ⚡ **Performance Optimization**

### Database Optimization
```sql
-- Use indexes for common queries
CREATE INDEX idx_messages_contact_created 
ON messages(contact_id, created_at DESC);

-- Use EXPLAIN to analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM contacts 
WHERE status = 'active' 
ORDER BY name;

-- Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### API Performance
```javascript
// Use pagination for large datasets
const getContacts = async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const limitNum = Math.min(parseInt(limit), 100); // Max 100
  
  const contacts = await contactService.getAllContacts({
    limit: limitNum,
    offset: parseInt(offset) || 0
  });
  
  res.json(contacts);
};

// Cache expensive operations
const getCachedStats = memoize(
  async () => await getSystemStats(),
  { ttl: 5 * 60 * 1000 } // 5 minutes
);
```

### Frontend Performance
```tsx
// Use React.memo for expensive components
const ContactCard = React.memo(({ contact }) => {
  return <div>{contact.name}</div>;
});

// Use virtual scrolling for large lists
const ContactList = ({ contacts }) => {
  return (
    <VirtualList
      items={contacts}
      height={400}
      itemHeight={60}
      renderItem={(contact) => <ContactCard contact={contact} />}
    />
  );
};

// Use debounced search
const ContactSearch = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const { data } = useContacts({ search: debouncedSearch });
};
```

---

## 🐛 **Debugging & Troubleshooting**

### Backend Debugging
```bash
# View backend logs
docker compose logs -f backend

# Check database connection
docker compose exec db psql -U postgres -d pharmacy -c "SELECT NOW();"

# Test API endpoints
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/health

# Check Winston logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### Frontend Debugging
```bash
# View frontend logs
docker compose logs -f frontend

# Check build issues
docker compose exec frontend npm run build

# Test frontend connectivity
curl http://localhost:3000
```

### Common Issues

**Backend Service Unhealthy**
```bash
# Check if backend is responding
curl http://localhost:3001/api/health

# Restart backend service  
docker compose restart backend

# Check for missing environment variables
docker compose exec backend env | grep -E "(JWT_SECRET|POSTGRES)"
```

**Database Connection Errors**
```bash
# Check database is running
docker compose ps db

# Test database connection
docker compose exec db pg_isready -U postgres

# Check database logs
docker compose logs db
```

**SMS Gateway Issues**
```bash
# Check Capcom6 connectivity (Local Server mode on Android via Tailscale)
curl http://100.126.232.47:8080/status

# Test SMS endpoint
curl -X POST http://localhost:3001/api/send-sms \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","message":"test"}'
```

### Performance Debugging
```javascript
// Add performance logging
const start = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - start;
logger.info('Operation completed', { duration: `${duration}ms` });

// Monitor database queries
const originalQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  const start = Date.now();
  const result = await originalQuery(text, params);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    logger.warn('Slow query', { query: text.substring(0, 100), duration });
  }
  
  return result;
};
```

---

## 🚀 **Advanced Topics**

### Custom Hooks
```tsx
// Create reusable business logic hooks
export const useContactManagement = () => {
  const queryClient = useQueryClient();
  
  const createContact = useMutation(apiService.createContact, {
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
    }
  });
  
  return {
    createContact: createContact.mutate,
    isCreating: createContact.isLoading
  };
};
```

### Error Boundaries
```tsx
class ApiErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    logger.error('React error boundary', { error, errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### Environment Management
```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
JWT_EXPIRY=1h

# Production
NODE_ENV=production
LOG_LEVEL=info
JWT_EXPIRY=24h
```

---

## 📚 **Additional Resources**

### Documentation
- [API Reference](./api/API_REFERENCE.md)
- [SMS Integration Guide](./SMS_INTEGRATION.md)
- [Architecture Overview](./architecture/DOCUMENT_INGESTION_SYSTEM.md)

### Tools & Extensions
- **VSCode Extensions**: ESLint, Prettier, TypeScript, Docker
- **Database Tools**: pgAdmin, DBeaver
- **API Testing**: Postman, Insomnia
- **Monitoring**: Docker Stats, htop

### Learning Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React TypeScript Patterns](https://react-typescript-cheatsheet.netlify.app/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

## 🆘 **Getting Help**

### Internal Support
1. **Check Documentation**: Start with this guide and API reference
2. **Review Logs**: `docker compose logs <service>`
3. **Check Issues**: GitHub repository issues
4. **Team Communication**: Internal development channels

### External Resources
- **Stack Overflow**: For general programming questions
- **GitHub Discussions**: For framework-specific questions
- **Documentation**: Official docs for React, Node.js, PostgreSQL

---

**Happy Coding! 🚀**