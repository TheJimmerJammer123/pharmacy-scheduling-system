// Input validation utilities for security

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

// Common validation rules
export const validationRules = {
  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  },
  
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  phone: (value: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value);
  },
  
  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min;
  },
  
  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max;
  },
  
  alphanumeric: (value: string): boolean => {
    return /^[a-zA-Z0-9\s]+$/.test(value);
  },
  
  numeric: (value: string): boolean => {
    return /^\d+$/.test(value);
  },
  
  positiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0;
  },
  
  date: (value: string): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  
  futureDate: (value: string): boolean => {
    const date = new Date(value);
    const now = new Date();
    return date > now;
  },
  
  pastDate: (value: string): boolean => {
    const date = new Date(value);
    const now = new Date();
    return date < now;
  },
  
  noSpecialChars: (value: string): boolean => {
    return !/[<>\"'&]/.test(value);
  },
  
  noScriptTags: (value: string): boolean => {
    return !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value);
  },
};

// Validation functions for specific data types
export const validateContact = (contact: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!validationRules.required(contact.name)) {
    errors.push('Name is required');
  } else if (!validationRules.minLength(2)(contact.name)) {
    errors.push('Name must be at least 2 characters long');
  } else if (!validationRules.maxLength(100)(contact.name)) {
    errors.push('Name must be less than 100 characters');
  } else if (!validationRules.noSpecialChars(contact.name)) {
    errors.push('Name contains invalid characters');
  }
  
  if (!validationRules.required(contact.phone)) {
    errors.push('Phone number is required');
  } else if (!validationRules.phone(contact.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (contact.email && !validationRules.email(contact.email)) {
    errors.push('Invalid email format');
  }
  
  if (contact.notes && !validationRules.maxLength(500)(contact.notes)) {
    errors.push('Notes must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMessage = (message: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!validationRules.required(message.content)) {
    errors.push('Message content is required');
  } else if (!validationRules.minLength(1)(message.content)) {
    errors.push('Message cannot be empty');
  } else if (!validationRules.maxLength(1000)(message.content)) {
    errors.push('Message must be less than 1000 characters');
  } else if (!validationRules.noScriptTags(message.content)) {
    errors.push('Message contains invalid content');
  }
  
  if (!validationRules.required(message.contact_id)) {
    errors.push('Contact ID is required');
  } else if (!validationRules.numeric(message.contact_id.toString())) {
    errors.push('Contact ID must be a number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateStoreSchedule = (schedule: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!validationRules.required(schedule.store_number)) {
    errors.push('Store number is required');
  } else if (!validationRules.positiveNumber(schedule.store_number)) {
    errors.push('Store number must be a positive number');
  }
  
  if (!validationRules.required(schedule.date)) {
    errors.push('Date is required');
  } else if (!validationRules.date(schedule.date)) {
    errors.push('Invalid date format');
  }
  
  if (schedule.employee_name && !validationRules.maxLength(100)(schedule.employee_name)) {
    errors.push('Employee name must be less than 100 characters');
  }
  
  if (schedule.shift_time && !validationRules.maxLength(50)(schedule.shift_time)) {
    errors.push('Shift time must be less than 50 characters');
  }
  
  if (schedule.notes && !validationRules.maxLength(500)(schedule.notes)) {
    errors.push('Notes must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDailySummary = (summary: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!validationRules.required(summary.date)) {
    errors.push('Date is required');
  } else if (!validationRules.date(summary.date)) {
    errors.push('Invalid date format');
  }
  
  if (summary.markdown_content && !validationRules.maxLength(10000)(summary.markdown_content)) {
    errors.push('Content must be less than 10,000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>\"'&]/g, '') // Remove special characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim();
};

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + at the beginning
  return phone.replace(/[^\d+]/g, '');
};

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }
    
    const requests = this.requests.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
  
  clear(): void {
    this.requests.clear();
  }
}

// Export a default rate limiter instance
export const defaultRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute