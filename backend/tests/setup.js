// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.LOG_LEVEL = 'error'; // Reduce logging in tests

// Mock database for tests
const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
  healthCheck: jest.fn()
};

// Mock database service
jest.mock('../services/databaseService', () => mockDb);

// Global test helpers
global.mockDb = mockDb;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});