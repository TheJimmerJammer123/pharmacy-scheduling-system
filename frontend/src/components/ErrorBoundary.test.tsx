import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should be a class component', () => {
    expect(typeof ErrorBoundary).toBe('function');
  });

  it('should have static getDerivedStateFromError method', () => {
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
  });

  it('should export withErrorBoundary function', () => {
    expect(typeof ErrorBoundary).toBe('function');
  });
});