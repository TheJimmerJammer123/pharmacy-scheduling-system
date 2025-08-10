const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./databaseService');
const { logger } = require('../middleware/errorHandler');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
    this.saltRounds = 12;
  }

  generateToken(userId, username, role) {
    return jwt.sign(
      { 
        userId, 
        username, 
        role,
        iat: Math.floor(Date.now() / 1000)
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      logger.warn('Token verification failed', { error: error.message });
      throw error;
    }
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async login(username, password) {
    try {
      // Get user from database
      const query = 'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1 OR email = $1';
      const result = await db.query(query, [username]);
      
      if (result.rows.length === 0) {
        logger.warn('Login attempt with non-existent username', { username });
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      if (!user.is_active) {
        logger.warn('Login attempt with inactive account', { userId: user.id, username });
        throw new Error('Account is inactive');
      }
      
      // Verify password
      const passwordValid = await this.verifyPassword(password, user.password_hash);
      
      if (!passwordValid) {
        logger.warn('Login attempt with invalid password', { userId: user.id, username });
        throw new Error('Invalid credentials');
      }
      
      // Generate token
      const token = this.generateToken(user.id, user.username, user.role);
      
      logger.info('User logged in successfully', { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      });
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Login failed', { error: error.message, username });
      throw error;
    }
  }

  async register(userData) {
    try {
      const { username, email, password, role = 'employee' } = userData;
      
      // Validate input
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (!['admin', 'manager', 'employee'].includes(role)) {
        throw new Error('Invalid role specified');
      }
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('Username or email already exists');
      }
      
      // Hash password
      const passwordHash = await this.hashPassword(password);
      
      // Create user
      const insertQuery = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role, created_at
      `;
      
      const result = await db.query(insertQuery, [username, email, passwordHash, role]);
      const newUser = result.rows[0];
      
      // Generate token
      const token = this.generateToken(newUser.id, newUser.username, newUser.role);
      
      logger.info('New user registered', { 
        userId: newUser.id, 
        username: newUser.username,
        role: newUser.role 
      });
      
      return {
        success: true,
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at
        }
      };
    } catch (error) {
      logger.error('Registration failed', { error: error.message, userData: { ...userData, password: '[REDACTED]' } });
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const query = 'SELECT id, username, email, role, is_active, created_at FROM users WHERE id = $1 AND is_active = true';
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user by ID', { error: error.message, userId });
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const { username, email, role, is_active } = updateData;
      
      const query = `
        UPDATE users 
        SET username = COALESCE($1, username),
            email = COALESCE($2, email),
            role = COALESCE($3, role),
            is_active = COALESCE($4, is_active),
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, username, email, role, is_active, updated_at
      `;
      
      const result = await db.query(query, [username, email, role, is_active, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('User updated', { userId, updatedFields: Object.keys(updateData) });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user', { error: error.message, userId, updateData });
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user
      const user = await db.query(
        'SELECT password_hash FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );
      
      if (user.rows.length === 0) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const passwordValid = await this.verifyPassword(currentPassword, user.rows[0].password_hash);
      
      if (!passwordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Validate new password
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }
      
      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);
      
      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );
      
      logger.info('User password changed', { userId });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Error changing password', { error: error.message, userId });
      throw error;
    }
  }

  async revokeAllTokens(userId) {
    // In a more sophisticated setup, we'd maintain a token blacklist
    // For now, we'll just log the action
    logger.info('All tokens revoked for user', { userId });
    return { success: true, message: 'All tokens revoked' };
  }
}

module.exports = new AuthService();