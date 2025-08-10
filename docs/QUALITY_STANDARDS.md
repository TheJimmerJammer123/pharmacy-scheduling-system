# 🎯 Code Quality Standards - Pharmacy Scheduling System

This document outlines the code quality standards, tools, and processes used to maintain high-quality code across the Pharmacy Scheduling System.

## 📋 **Table of Contents**

- [Overview](#overview)
- [Code Standards](#code-standards)
- [Quality Tools](#quality-tools)
- [Automation](#automation)
- [Quality Metrics](#quality-metrics)
- [Best Practices](#best-practices)

---

## 🎯 **Overview**

Our quality standards ensure:
- **Consistent Code Style**: Uniform formatting and conventions
- **Bug Prevention**: Early detection of potential issues
- **Security**: Vulnerability scanning and secure coding practices
- **Performance**: Code optimization and monitoring
- **Maintainability**: Clean, readable, and well-documented code

### Quality Gates
All code must pass these gates before merging:
1. ✅ Linting (ESLint)
2. ✅ Code Formatting (Prettier)
3. ✅ Type Checking (TypeScript)
4. ✅ Unit Tests (Jest)
5. ✅ Security Audit
6. ✅ Build Success

---

## 📏 **Code Standards**

### Backend (Node.js/JavaScript)
```javascript
// ✅ Good: Consistent naming and structure
const getUserById = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return user.rows[0];
  } catch (error) {
    logger.error('Failed to get user', { userId, error: error.message });
    throw error;
  }
};

// ❌ Bad: Inconsistent style, no error handling
const getuser = (id) => {
  return db.query(`SELECT * FROM users WHERE id = '${id}'`);
};
```

### Frontend (React/TypeScript)
```tsx
// ✅ Good: TypeScript interfaces, proper component structure
interface UserProps {
  userId: string;
  onUserSelect: (user: User) => void;
}

const UserCard: React.FC<UserProps> = ({ userId, onUserSelect }) => {
  const { data: user, isLoading, error } = useQuery(['user', userId], 
    () => apiService.getUser(userId)
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;

  return (
    <Card onClick={() => onUserSelect(user)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </Card>
  );
};

// ❌ Bad: No types, inline styles, no error handling
const UserCard = ({ userId }) => {
  const [user, setUser] = useState();
  
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, []);

  return <div style={{padding: '10px'}}>{user?.name}</div>;
};
```

---

## 🛠️ **Quality Tools**

### ESLint Configuration
- **Backend**: `backend/.eslintrc.js`
- **Frontend**: `frontend/.eslintrc.cjs`

**Key Rules:**
- `no-unused-vars`: Prevent unused variables
- `prefer-const`: Use const for immutable variables
- `eqeqeq`: Require strict equality
- `no-console`: Warn on console statements
- Security rules for SQL injection prevention

### Prettier Configuration
- **Consistent formatting**: `semi: true`, `singleQuote: true`
- **Line length**: `printWidth: 100`
- **Indentation**: `tabWidth: 2`

### TypeScript
- **Strict mode enabled**: Catches type errors early
- **No implicit any**: Forces explicit typing
- **Null checks**: Prevents null/undefined errors

### Husky Git Hooks
- **Pre-commit**: Runs linting, formatting, and tests
- **Commit-msg**: Validates commit message format

---

## 🤖 **Automation**

### GitHub Actions Workflow
**File**: `.github/workflows/quality-checks.yml`

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main`

**Jobs**:
1. **Backend Quality**: Linting, formatting, tests, coverage
2. **Frontend Quality**: Linting, formatting, TypeScript, tests, build
3. **Security Scan**: Dependency audit, CodeQL analysis
4. **Quality Gate**: Final validation

### Local Quality Script
**File**: `scripts/quality-check.sh`

Run comprehensive quality checks locally:
```bash
./scripts/quality-check.sh
```

**Features**:
- ✅ Full project quality validation
- 🔧 Auto-fixes formatting issues
- 📊 Security vulnerability scanning
- 🐳 Docker services health check
- 📈 Detailed progress reporting

---

## 📊 **Quality Metrics**

### Code Coverage Targets
- **Backend**: Minimum 80% coverage
- **Frontend**: Minimum 75% coverage
- **Critical paths**: 95% coverage required

### Performance Metrics
- **Build time**: < 2 minutes
- **Test execution**: < 30 seconds
- **Lint checking**: < 15 seconds
- **Type checking**: < 10 seconds

### Security Standards
- **Dependency scanning**: Weekly automated scans
- **Vulnerability threshold**: No high/critical vulnerabilities
- **Code analysis**: CodeQL security analysis on all PRs

---

## 💡 **Best Practices**

### 1. Write Self-Documenting Code
```javascript
// ✅ Good: Clear function names and structure
const calculateMonthlySubscriptionFee = (userId, planType) => {
  const baseFee = getBaseFeeForPlan(planType);
  const discounts = getUserDiscounts(userId);
  return applyDiscounts(baseFee, discounts);
};

// ❌ Bad: Unclear purpose and magic numbers
const calc = (u, p) => {
  return p === 'premium' ? 29.99 : 9.99;
};
```

### 2. Error Handling
```javascript
// ✅ Good: Comprehensive error handling
const processPayment = async (paymentData) => {
  try {
    validatePaymentData(paymentData);
    const result = await paymentService.charge(paymentData);
    
    logger.info('Payment processed successfully', { 
      transactionId: result.id,
      amount: paymentData.amount 
    });
    
    return result;
  } catch (error) {
    logger.error('Payment processing failed', {
      error: error.message,
      paymentData: sanitize(paymentData)
    });
    
    throw new PaymentError('Payment failed', error);
  }
};
```

### 3. Testing Strategy
```javascript
// ✅ Good: Comprehensive test coverage
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const result = await userService.createUser(userData);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for invalid email', async () => {
      const userData = { name: 'John Doe', email: 'invalid-email' };
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should hash password before storing', async () => {
      const userData = { 
        name: 'John Doe', 
        email: 'john@example.com',
        password: 'plaintext'
      };
      
      const result = await userService.createUser(userData);
      
      expect(result.password).not.toBe('plaintext');
      expect(result.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash
    });
  });
});
```

### 4. Security Practices
```javascript
// ✅ Good: Input validation and sanitization
const createContact = async (req, res) => {
  const { name, phone, email } = req.body;
  
  // Validate inputs
  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  
  if (phone && !isValidPhoneNumber(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }
  
  // Sanitize inputs
  const sanitizedData = {
    name: sanitizeString(name),
    phone: sanitizePhoneNumber(phone),
    email: sanitizeEmail(email)
  };
  
  const contact = await contactService.createContact(sanitizedData);
  res.status(201).json(contact);
};
```

---

## 🚀 **Usage Commands**

### Backend Quality Checks
```bash
cd backend

# Linting
npm run lint          # Check for issues
npm run lint:fix      # Fix issues automatically

# Formatting
npm run format        # Format all files
npm run format:check  # Check formatting

# Testing
npm run test          # Run tests
npm run test:coverage # Run with coverage
npm run test:watch    # Watch mode

# Complete quality check
npm run quality       # Lint + Format + Test
```

### Frontend Quality Checks
```bash
cd frontend

# Linting
npm run lint          # Check for issues
npm run lint:fix      # Fix issues automatically

# Formatting
npm run format        # Format all files
npm run format:check  # Check formatting

# Type checking
npm run type-check    # TypeScript validation

# Testing
npm run test          # Run tests
npm run test:coverage # Run with coverage

# Complete quality check
npm run quality       # Lint + Format + TypeScript + Test
```

### Project-wide Quality Check
```bash
# Run comprehensive quality check
./scripts/quality-check.sh

# Individual checks
git add . && git commit -m "feat: test quality gates"  # Triggers pre-commit hooks
```

---

## 📈 **Quality Monitoring**

### Continuous Integration
- **Automated testing** on every commit
- **Security scanning** on dependency updates
- **Code coverage tracking** with reports
- **Performance regression detection**

### Code Review Process
1. **Automated checks** must pass first
2. **Peer review** required for all changes
3. **Architecture review** for significant changes
4. **Security review** for authentication/authorization changes

### Quality Metrics Dashboard
- **Test coverage trends**
- **Code quality scores** (ESLint violations)
- **Security vulnerability counts**
- **Build success rates**
- **Performance benchmarks**

---

## 🎯 **Quality Goals**

### Short-term (1-3 months)
- [ ] Achieve 85% test coverage across backend
- [ ] Implement automated performance testing
- [ ] Set up code quality metrics dashboard
- [ ] Zero high-severity security vulnerabilities

### Long-term (6-12 months)
- [ ] Achieve 90% test coverage across entire project
- [ ] Implement mutation testing
- [ ] Set up automated accessibility testing
- [ ] Establish performance budgets and monitoring

---

## 🆘 **Troubleshooting**

### Common Issues

**ESLint errors after updating dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run lint:fix
```

**Prettier conflicts with ESLint:**
```bash
npm install --save-dev eslint-config-prettier
# Add to .eslintrc.js extends array
```

**TypeScript errors in tests:**
```bash
# Update jest.config.js with proper TypeScript support
npm install --save-dev ts-jest @types/jest
```

**Pre-commit hook failures:**
```bash
# Skip hooks for emergency commits (use sparingly)
git commit --no-verify -m "emergency: fix critical issue"

# Fix quality issues
npm run quality
```

---

**Maintaining high code quality is a team effort! 🚀**