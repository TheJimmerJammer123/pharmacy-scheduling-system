module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};