const { v4: uuidv4, validate: uuidValidate } = require('uuid');

// UUID validation middleware
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({ 
        error: `Missing required parameter: ${paramName}`,
        code: 'MISSING_PARAMETER'
      });
    }
    
    if (id === 'undefined' || id === 'null') {
      return res.status(400).json({ 
        error: `Invalid ${paramName}: received '${id}'`,
        code: 'INVALID_UUID_FORMAT'
      });
    }
    
    if (!uuidValidate(id)) {
      return res.status(400).json({ 
        error: `Invalid UUID format for ${paramName}: ${id}`,
        code: 'INVALID_UUID_FORMAT'
      });
    }
    
    next();
  };
};

// General request validation middleware
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of fields) {
      if (!req.body[field]) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
        code: 'MISSING_REQUIRED_FIELDS',
        missing_fields: missing
      });
    }
    
    next();
  };
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (basic)
const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Contact validation middleware
const validateContact = (req, res, next) => {
  const { name, phone, email, priority, status } = req.body;
  const errors = [];
  
  if (name && name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (phone && !validatePhone(phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (email && !validateEmail(email)) {
    errors.push('Invalid email format');
  }
  
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }
  
  if (status && !['active', 'inactive'].includes(status)) {
    errors.push('Status must be one of: active, inactive');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      validation_errors: errors
    });
  }
  
  next();
};

// SMS validation middleware
const validateSMS = (req, res, next) => {
  const { to, message } = req.body;
  const errors = [];
  
  if (!to) {
    errors.push('Phone number (to) is required');
  } else if (!validatePhone(to)) {
    errors.push('Invalid phone number format');
  }
  
  if (!message) {
    errors.push('Message content is required');
  } else if (message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (message.length > 1600) {
    errors.push('Message too long (max 1600 characters)');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'SMS validation failed',
      code: 'SMS_VALIDATION_ERROR',
      validation_errors: errors
    });
  }
  
  next();
};

module.exports = {
  validateUUID,
  validateRequiredFields,
  validateContact,
  validateSMS,
  validateEmail,
  validatePhone
};