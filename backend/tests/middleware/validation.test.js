const { validateUUID, validateRequiredFields, validateContact, validateSMS } = require('../../middleware/validation');

describe('Validation Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('validateUUID', () => {
    const middleware = validateUUID('id');

    it('should pass for valid UUID', () => {
      mockReq.params.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject missing parameter', () => {
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required parameter: id',
        code: 'MISSING_PARAMETER'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject "undefined" string', () => {
      mockReq.params.id = 'undefined';

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid id: received \'undefined\'',
        code: 'INVALID_UUID_FORMAT'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid UUID format', () => {
      mockReq.params.id = 'invalid-uuid';

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid UUID format for id: invalid-uuid',
        code: 'INVALID_UUID_FORMAT'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateRequiredFields', () => {
    const middleware = validateRequiredFields(['name', 'email']);

    it('should pass when all required fields are present', () => {
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com'
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject when required fields are missing', () => {
      mockReq.body = {
        name: 'Test User'
        // email is missing
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: email',
        code: 'MISSING_REQUIRED_FIELDS',
        missing_fields: ['email']
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateContact', () => {
    it('should pass for valid contact data', () => {
      mockReq.body = {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        priority: 'high',
        status: 'active'
      };

      validateContact(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', () => {
      mockReq.body = {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'invalid-email',
        priority: 'high',
        status: 'active'
      };

      validateContact(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        validation_errors: ['Invalid email format']
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid priority', () => {
      mockReq.body = {
        name: 'John Doe',
        phone: '+1234567890',
        priority: 'invalid'
      };

      validateContact(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        validation_errors: ['Priority must be one of: low, medium, high']
      });
    });

    it('should reject short name', () => {
      mockReq.body = {
        name: 'A', // Too short
        phone: '+1234567890'
      };

      validateContact(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        validation_errors: ['Name must be at least 2 characters long']
      });
    });
  });

  describe('validateSMS', () => {
    it('should pass for valid SMS data', () => {
      mockReq.body = {
        to: '+1234567890',
        message: 'Hello, this is a test message'
      };

      validateSMS(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject missing phone number', () => {
      mockReq.body = {
        message: 'Hello, this is a test message'
      };

      validateSMS(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'SMS validation failed',
        code: 'SMS_VALIDATION_ERROR',
        validation_errors: ['Phone number (to) is required']
      });
    });

    it('should reject empty message', () => {
      mockReq.body = {
        to: '+1234567890',
        message: ''
      };

      validateSMS(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'SMS validation failed',
        code: 'SMS_VALIDATION_ERROR',
        validation_errors: ['Message content is required']
      });
    });

    it('should reject message too long', () => {
      mockReq.body = {
        to: '+1234567890',
        message: 'a'.repeat(1601) // Too long
      };

      validateSMS(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'SMS validation failed',
        code: 'SMS_VALIDATION_ERROR',
        validation_errors: ['Message too long (max 1600 characters)']
      });
    });

    it('should reject invalid phone format', () => {
      mockReq.body = {
        to: 'invalid-phone',
        message: 'Test message'
      };

      validateSMS(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'SMS validation failed',
        code: 'SMS_VALIDATION_ERROR',
        validation_errors: ['Invalid phone number format']
      });
    });
  });
});