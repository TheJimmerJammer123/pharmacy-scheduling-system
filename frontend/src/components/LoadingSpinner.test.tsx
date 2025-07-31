import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should be a function component', () => {
    expect(typeof LoadingSpinner).toBe('function');
  });

  it('should accept size prop', () => {
    const props = { size: 'lg' as const };
    expect(() => LoadingSpinner(props)).not.toThrow();
  });

  it('should accept className prop', () => {
    const props = { className: 'test-class' };
    expect(() => LoadingSpinner(props)).not.toThrow();
  });

  it('should work with no props', () => {
    expect(() => LoadingSpinner({})).not.toThrow();
  });
});