import { Dashboard } from './Dashboard';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Dashboard', () => {
  it('should be a function component', () => {
    expect(typeof Dashboard).toBe('function');
  });

  it('should accept props', () => {
    const props = {
      activeTab: 'dashboard',
      setActiveTab: jest.fn(),
      refreshTrigger: 1,
    };
    
    // Just test that the component can be called with props
    expect(() => Dashboard(props)).not.toThrow();
  });

  it('should have expected prop types', () => {
    const props = {
      activeTab: 'dashboard',
      setActiveTab: jest.fn(),
    };
    
    // Test that optional props work
    expect(() => Dashboard(props)).not.toThrow();
  });
});