// Error handling utilities

export interface AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  details?: any;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// Error codes
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  
  // API errors
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // Security errors
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  CSRF_VIOLATION: 'CSRF_VIOLATION',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// Create custom error class
export class AppError extends Error implements AppError {
  public code: string;
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    code: string = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Error factory functions
export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(message, ErrorCodes.VALIDATION_ERROR, 400, true, details);
};

export const createUnauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, ErrorCodes.UNAUTHORIZED, 401, true);
};

export const createForbiddenError = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, ErrorCodes.FORBIDDEN, 403, true);
};

export const createNotFoundError = (message: string = 'Resource not found'): AppError => {
  return new AppError(message, ErrorCodes.NOT_FOUND, 404, true);
};

export const createConflictError = (message: string = 'Resource conflict'): AppError => {
  return new AppError(message, ErrorCodes.RESOURCE_CONFLICT, 409, true);
};

export const createRateLimitError = (message: string = 'Rate limit exceeded'): AppError => {
  return new AppError(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429, true);
};

export const createSecurityError = (message: string, code: string = ErrorCodes.SECURITY_VIOLATION): AppError => {
  return new AppError(message, code, 403, true);
};

export const createInternalError = (message: string = 'Internal server error'): AppError => {
  return new AppError(message, ErrorCodes.INTERNAL_ERROR, 500, false);
};

// Error response formatter
export const formatErrorResponse = (error: AppError | Error): ErrorResponse => {
  const appError = error instanceof AppError ? error : createInternalError(error.message);
  
  return {
    success: false,
    error: appError.message,
    code: appError.code,
    details: appError.details,
    timestamp: new Date().toISOString(),
  };
};

// Global error handler
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: AppError; timestamp: Date; context?: any }> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: AppError | Error, context?: any): void {
    const appError = error instanceof AppError ? error : createInternalError(error.message);
    
    // Log the error
    this.logError(appError, context);
    
    // In production, you might want to send to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError, context);
    }
    
    // For non-operational errors, you might want to restart the process
    if (!appError.isOperational) {
      this.handleFatalError(appError);
    }
  }

  private logError(error: AppError, context?: any): void {
    const logEntry = {
      error,
      timestamp: new Date(),
      context,
    };
    
    this.errorLog.push(logEntry);
    
    // Keep only the last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    console.error(`[${logEntry.timestamp.toISOString()}] ${error.code}: ${error.message}`, {
      stack: error.stack,
      context,
    });
  }

  private reportError(error: AppError, context?: any): void {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or your own error tracking system
    console.error('Error reported to monitoring service:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      context,
    });
  }

  private handleFatalError(error: AppError): void {
    console.error('Fatal error occurred:', error);
    // In a real application, you might want to gracefully shutdown
    // process.exit(1);
  }

  getErrorLog(): Array<{ error: AppError; timestamp: Date; context?: any }> {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Async error wrapper
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.getInstance().handleError(error as Error);
      throw error;
    }
  };
};

// Promise error wrapper
export const withErrorHandling = <T>(
  promise: Promise<T>,
  context?: any
): Promise<T> => {
  return promise.catch((error) => {
    ErrorHandler.getInstance().handleError(error, context);
    throw error;
  });
};

// Validation error handler
export const handleValidationError = (errors: string[]): AppError => {
  return createValidationError('Validation failed', { errors });
};

// Network error handler
export const handleNetworkError = (error: any): AppError => {
  if (error.name === 'AbortError') {
    return new AppError('Request timeout', ErrorCodes.TIMEOUT_ERROR, 408, true);
  }
  
  if (error.message?.includes('fetch')) {
    return new AppError('Network error', ErrorCodes.NETWORK_ERROR, 503, true);
  }
  
  return createInternalError('Unexpected error occurred');
};

// Security error handlers
export const handleSecurityViolation = (type: string, details?: any): AppError => {
  const errorMap: { [key: string]: string } = {
    'xss': ErrorCodes.XSS_ATTEMPT,
    'sql-injection': ErrorCodes.SQL_INJECTION_ATTEMPT,
    'csrf': ErrorCodes.CSRF_VIOLATION,
    'rate-limit': ErrorCodes.RATE_LIMIT_EXCEEDED,
  };
  
  const code = errorMap[type] || ErrorCodes.SECURITY_VIOLATION;
  return createSecurityError(`Security violation: ${type}`, code);
};

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();