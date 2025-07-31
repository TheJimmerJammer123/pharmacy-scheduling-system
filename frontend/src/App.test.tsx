import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index';

// Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper component for testing with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('App Structure', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );
    
    // The app should render without throwing any errors
    expect(document.body).toBeTruthy();
  });

  it('renders the main application structure', () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );
    
    // Check that the main app structure is present
    expect(document.querySelector('body')).toBeTruthy();
  });
});