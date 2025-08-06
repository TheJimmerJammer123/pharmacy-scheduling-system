import '@testing-library/jest-dom';

// Mock environment variables for Vite
const mockEnv = {
  VITE_API_URL: 'http://test-api.com',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  DEV: true,
  PROD: false,
  MODE: 'test',
};

// Mock import.meta.env
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: mockEnv
    }
  },
  writable: true,
});

// Also mock process.env for compatibility
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    ...mockEnv
  },
  writable: true,
});

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Element type is invalid') ||
       args[0].includes('Target container is not a DOM element'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});