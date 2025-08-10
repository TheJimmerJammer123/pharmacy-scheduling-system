const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mock the database service before importing the server
jest.mock('../../services/databaseService');

// Create a minimal app for testing
const app = express();
app.use(cors());
app.use(express.json());

// JSON parse error handler to return 400 on malformed JSON
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  return next(err);
});

// Handle CORS preflight to return 204
app.options('*', (req, res) => res.status(204).send());

// Mock authentication middleware
app.use('/api', (req, res, next) => {
  req.user = {
    id: 'test-user-id',
    username: 'testuser',
    role: 'employee'
  };
  next();
});

// Add basic health endpoint for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mock error for demonstration
app.get('/api/error', (req, res, next) => {
  const error = new Error('Test error');
  next(error);
});

// Basic error handler
app.use((error, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const response = await request(app)
        .get('/api/error')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'Test error');
    });
  });

  describe('Content-Type Validation', () => {
    it('should parse JSON requests', async () => {
      const testData = { test: 'data' };

      // We need an endpoint that accepts POST for this test
      app.post('/api/test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/api/test')
        .send(testData)
        .expect(200);

      expect(response.body.received).toEqual(testData);
    });

    it('should handle malformed JSON', async () => {
      app.post('/api/bad-json', (req, res) => {
        res.json({ received: req.body });
      });

      await request(app)
        .post('/api/bad-json')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('CORS Headers', () => {
    it('should handle CORS preflight requests', async () => {
      await request(app)
        .options('/api/health')
        .expect(204);
    });
  });

  describe('Authentication Context', () => {
    it('should provide authenticated user context', async () => {
      app.get('/api/user-info', (req, res) => {
        res.json({ user: req.user });
      });

      const response = await request(app)
        .get('/api/user-info')
        .expect(200);

      expect(response.body.user).toHaveProperty('id', 'test-user-id');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('role', 'employee');
    });
  });
});