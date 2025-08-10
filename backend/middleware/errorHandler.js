const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pharmacy-backend' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs to file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });
  
  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous'
    });
  });
  
  next();
};

// Database error handler
const handleDatabaseError = (error, context = {}) => {
  const dbError = {
    message: 'Database operation failed',
    type: 'DATABASE_ERROR',
    context,
    timestamp: new Date().toISOString()
  };

  // Handle specific PostgreSQL errors
  switch (error.code) {
    case '23505': // unique_violation
      dbError.message = 'Record already exists';
      dbError.type = 'DUPLICATE_RECORD';
      dbError.statusCode = 409;
      break;
    case '23503': // foreign_key_violation
      dbError.message = 'Referenced record not found';
      dbError.type = 'FOREIGN_KEY_ERROR';
      dbError.statusCode = 400;
      break;
    case '22P02': // invalid_text_representation (UUID error)
      dbError.message = 'Invalid data format provided';
      dbError.type = 'INVALID_FORMAT';
      dbError.statusCode = 400;
      break;
    case '23502': // not_null_violation
      dbError.message = 'Required field is missing';
      dbError.type = 'MISSING_REQUIRED_FIELD';
      dbError.statusCode = 400;
      break;
    case '42P01': // undefined_table
      dbError.message = 'Database table not found';
      dbError.type = 'TABLE_NOT_FOUND';
      dbError.statusCode = 500;
      break;
    default:
      dbError.statusCode = 500;
  }

  logger.error('Database error', {
    error: error.message,
    code: error.code,
    detail: error.detail,
    context,
    stack: error.stack
  });

  return dbError;
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Default error response
  let errorResponse = {
    error: 'Internal server error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString(),
    requestId: req.id || Date.now().toString()
  };

  // Handle different error types
  if (error.name === 'ValidationError') {
    errorResponse = {
      error: 'Validation failed',
      message: error.message,
      type: 'VALIDATION_ERROR',
      statusCode: 400,
      timestamp: new Date().toISOString()
    };
  } else if (error.code) {
    // Database error
    const dbError = handleDatabaseError(error, {
      method: req.method,
      url: req.url,
      userId: req.user?.id
    });
    errorResponse = dbError;
  } else if (error.name === 'JsonWebTokenError') {
    errorResponse = {
      error: 'Authentication failed',
      message: 'Invalid token',
      type: 'AUTH_ERROR',
      statusCode: 401,
      timestamp: new Date().toISOString()
    };
  } else if (error.name === 'TokenExpiredError') {
    errorResponse = {
      error: 'Authentication failed',
      message: 'Token expired',
      type: 'TOKEN_EXPIRED',
      statusCode: 401,
      timestamp: new Date().toISOString()
    };
  }

  // Log the error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id || 'anonymous',
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Send error response
  const statusCode = errorResponse.statusCode || 500;
  
  // Don't expose internal details in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.stack;
    if (statusCode >= 500) {
      errorResponse.message = 'Internal server error';
    }
  } else {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    type: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  logger,
  requestLogger,
  globalErrorHandler,
  notFoundHandler,
  handleDatabaseError,
  asyncHandler
};