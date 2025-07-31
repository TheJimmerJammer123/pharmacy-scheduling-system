// Security configuration and utilities

export interface SecurityHeaders {
  [key: string]: string;
}

// Default security headers
export const defaultSecurityHeaders: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your actual domain
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Input sanitization rules
export const sanitizationRules = {
  // HTML tags to allow in markdown content
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
  ],
  
  // HTML attributes to allow
  allowedAttributes: {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id']
  },
  
  // CSS properties to allow
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/]
    }
  }
};

// Password strength requirements
export const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const,
  },
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  expiresIn: '24h',
  algorithm: 'HS256' as const,
};

// API key validation
export const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey) return false;
  
  // Basic validation - should be at least 32 characters
  if (apiKey.length < 32) return false;
  
  // Should contain alphanumeric characters
  if (!/^[a-zA-Z0-9\-_]+$/.test(apiKey)) return false;
  
  return true;
};

// CSRF protection
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken;
};

// SQL injection prevention
export const sanitizeSQLInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .replace(/union\s+select/gi, '') // Remove UNION SELECT
    .replace(/drop\s+table/gi, '') // Remove DROP TABLE
    .replace(/delete\s+from/gi, '') // Remove DELETE FROM
    .replace(/insert\s+into/gi, '') // Remove INSERT INTO
    .replace(/update\s+set/gi, '') // Remove UPDATE SET
    .trim();
};

// XSS prevention
export const sanitizeXSS = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// File upload validation
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }
  
  return { isValid: true };
};

// Environment-specific security settings
export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isProduction,
    securityHeaders: {
      ...defaultSecurityHeaders,
      // Add stricter CSP in production
      'Content-Security-Policy': isProduction 
        ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
        : defaultSecurityHeaders['Content-Security-Policy'],
    },
    cors: {
      ...corsConfig,
      origin: isProduction ? corsConfig.origin[0] : corsConfig.origin,
    },
    rateLimit: {
      ...rateLimitConfig,
      max: isProduction ? 50 : 100, // Stricter rate limiting in production
    },
  };
};