const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger } = require('./errorHandler');

// Enhanced security middleware configuration
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'none'"]
    },
  },
  crossOriginEmbedderPolicy: false, // Disabled for Socket.IO compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
      
      res.status(429).json({
        error: message,
        type: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Strict rate limiting for authentication endpoints
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many login attempts, please try again later',
  true // Skip successful requests
);

// Medium rate limiting for SMS endpoints (expensive operations)
const smsLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  10, // 10 SMS per 5 minutes
  'SMS rate limit exceeded, please try again later'
);

// General API rate limiting
const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests per minute
  'API rate limit exceeded, please try again later'
);

// Aggressive rate limiting for registration
const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 registrations per hour
  'Registration rate limit exceeded, please try again later'
);

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Remove dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-forwarded-server'];
  
  // Sanitize user input by trimming strings
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  
  next();
};

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Trim whitespace and remove null bytes
      obj[key] = obj[key].trim().replace(/\0/g, '');
      
      // Prevent extremely long strings
      if (obj[key].length > 10000) {
        obj[key] = obj[key].substring(0, 10000);
      }
    } else if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

// Request logging for security events
const securityLogger = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i, // XSS attempt
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /vbscript:/i, // VBScript injection
    /onload=/i, // Event handler injection
    /onerror=/i // Event handler injection
  ];
  
  const url = req.url.toLowerCase();
  const body = JSON.stringify(req.body || {}).toLowerCase();
  const query = JSON.stringify(req.query || {}).toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
      logger.warn('Suspicious request detected', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        pattern: pattern.toString()
      });
      break;
    }
  }
  
  next();
};

// CORS configuration
const getCorsOptions = () => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://100.120.219.68:3000', // Tailscale address
    process.env.FRONTEND_URL
  ].filter(Boolean);

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS request from unauthorized origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
};

// IP whitelist middleware (for admin functions)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    logger.warn('Unauthorized IP access attempt', {
      ip: clientIP,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(403).json({
      error: 'Access denied',
      type: 'IP_NOT_WHITELISTED'
    });
  };
};

// Validate JWT secret on startup
const validateJWTSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret || jwtSecret === 'fallback-secret-change-in-production') {
    logger.error('SECURITY WARNING: JWT_SECRET is not set or using fallback value');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }
  
  if (jwtSecret && jwtSecret.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters long');
  }
};

module.exports = {
  securityMiddleware,
  loginLimiter,
  smsLimiter,
  apiLimiter,
  registerLimiter,
  sanitizeRequest,
  securityLogger,
  getCorsOptions,
  ipWhitelist,
  validateJWTSecret
};