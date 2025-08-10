const authService = require('../../services/authService');
const bcrypt = require('bcryptjs');

jest.mock('bcryptjs');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockClear();
  });

  describe('login', () => {
    const mockUser = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      role: 'employee',
      is_active: true
    };

    it('should login successfully with valid credentials', async () => {
      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(result.user.role).toBe('employee');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1 OR email = $1',
        ['testuser']
      );
    });

    it('should throw error for non-existent user', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(authService.login('nonexistent', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockDb.query.mockResolvedValue({ rows: [inactiveUser] });

      await expect(authService.login('testuser', 'password123'))
        .rejects.toThrow('Account is inactive');
    });

    it('should throw error for invalid password', async () => {
      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    const userData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      role: 'employee'
    };

    const mockNewUser = {
      id: 'new-user-id',
      username: 'newuser',
      email: 'new@example.com',
      role: 'employee',
      created_at: new Date()
    };

    it('should register new user successfully', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [mockNewUser] }); // Create user
      bcrypt.hash.mockResolvedValue('hashed-password');

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('newuser');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should throw error for existing user', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: 'existing-id' }] });

      await expect(authService.register(userData))
        .rejects.toThrow('Username or email already exists');
    });

    it('should throw error for short password', async () => {
      const shortPasswordData = { ...userData, password: '123' };

      await expect(authService.register(shortPasswordData))
        .rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error for invalid role', async () => {
      const invalidRoleData = { ...userData, role: 'invalid' };

      await expect(authService.register(invalidRoleData))
        .rejects.toThrow('Invalid role specified');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = { userId: 'test-id', username: 'test', role: 'employee' };
      const token = authService.generateToken(payload.userId, payload.username, payload.role);

      const result = await authService.verifyToken(token);

      expect(result.userId).toBe(payload.userId);
      expect(result.username).toBe(payload.username);
      expect(result.role).toBe(payload.role);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid-token'))
        .rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ password_hash: 'current-hash' }] })
        .mockResolvedValueOnce({ rows: [] }); // Update query
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new-hash');

      const result = await authService.changePassword('user-id', 'current', 'newpass123');

      expect(result.success).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('current', 'current-hash');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12);
    });

    it('should throw error for incorrect current password', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ password_hash: 'current-hash' }] });
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.changePassword('user-id', 'wrong', 'newpass123'))
        .rejects.toThrow('Current password is incorrect');
    });
  });
});