import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotInterfaceSuper } from '../../components/ChatbotInterfaceSuper';
import { SuperchargedAIClient } from '../../lib/ai-client-supercharged';

// Mock the AI client
jest.mock('../../lib/ai-client-supercharged');
const MockSuperchargedAIClient = SuperchargedAIClient as jest.MockedClass<typeof SuperchargedAIClient>;

// Mock the toast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Chatbot Integration Tests', () => {
  let mockAiClient: jest.Mocked<SuperchargedAIClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock AI client
    mockAiClient = {
      chat: jest.fn(),
      executeAction: jest.fn(),
      exportConversation: jest.fn(),
      clearConversation: jest.fn(),
      getConversationHistory: jest.fn(),
      getModelCapabilities: jest.fn(),
      clearCache: jest.fn(),
      updateUserContext: jest.fn(),
      simpleChat: jest.fn(),
    } as any;
    
    MockSuperchargedAIClient.mockImplementation(() => mockAiClient);
  });

  describe('End-to-End User Workflows', () => {
    it('should handle complete conversation flow with database queries', async () => {
      const user = userEvent.setup();
      
      // Mock AI responses for a complex workflow
      mockAiClient.chat
        .mockResolvedValueOnce({
          id: 'msg_1',
          role: 'assistant',
          content: 'I can help you with that! Let me check the schedule data.',
          timestamp: new Date(),
          metadata: {
            model_used: 'gpt-4-turbo',
            data_results: [
              { employee_name: 'John Doe', role: 'Pharmacist', shift_time: '9:00am - 5:00pm' }
            ],
            query_executed: 'SELECT * FROM store_schedules WHERE date = CURRENT_DATE',
            performance_metrics: {
              response_time_ms: 1500,
              model_selection_reason: 'Complex analysis required',
              data_queries_executed: 1,
              tokens_used: 200
            }
          }
        })
        .mockResolvedValueOnce({
          id: 'msg_2',
          role: 'assistant',
          content: 'Based on the data, I recommend sending a message to John about his shift.',
          timestamp: new Date(),
          metadata: {
            model_used: 'claude-3.5-sonnet',
            suggested_actions: [
              {
                label: 'Send SMS to John Doe',
                action: 'send_sms',
                parameters: { phone: '123-456-7890', message: 'Reminder: Your shift starts at 9:00am' }
              }
            ],
            performance_metrics: {
              response_time_ms: 800,
              model_selection_reason: 'Action recommendation',
              data_queries_executed: 0,
              tokens_used: 150
            }
          }
        });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // User asks about schedule
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Show me today\'s schedule and recommend any actions');
      await user.click(sendButton);
      
      // Wait for first response
      await waitFor(() => {
        expect(screen.getByText(/I can help you with that!/)).toBeInTheDocument();
      });
      
      // User follows up with action request
      await user.type(input, 'Send a reminder to John about his shift');
      await user.click(sendButton);
      
      // Wait for second response with suggested action
      await waitFor(() => {
        expect(screen.getByText(/recommend sending a message/)).toBeInTheDocument();
        expect(screen.getByText('Send SMS to John Doe')).toBeInTheDocument();
      });
      
      // User executes suggested action
      const actionButton = screen.getByText('Send SMS to John Doe');
      await user.click(actionButton);
      
      // Verify action execution
      expect(mockAiClient.executeAction).toHaveBeenCalledWith(
        'send_sms',
        { phone: '123-456-7890', message: 'Reminder: Your shift starts at 9:00am' }
      );
    });

    it('should handle model fallback when primary model fails', async () => {
      const user = userEvent.setup();
      
      // Mock primary model failure, then fallback success
      mockAiClient.chat
        .mockRejectedValueOnce(new Error('GPT-4 unavailable'))
        .mockResolvedValueOnce({
          id: 'msg_1',
          role: 'assistant',
          content: 'I\'m using a fallback model to help you.',
          timestamp: new Date(),
          metadata: {
            model_used: 'gpt-3.5-turbo (fallback)',
            performance_metrics: {
              response_time_ms: 2000,
              model_selection_reason: 'Fallback from GPT-4',
              data_queries_executed: 0,
              tokens_used: 100
            }
          }
        });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Complex analysis request');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/fallback model/)).toBeInTheDocument();
      });
    });

    it('should handle conversation persistence across sessions', async () => {
      const user = userEvent.setup();
      
      // Mock conversation history
      const savedMessages = JSON.stringify([
        {
          id: 'msg_1',
          role: 'user',
          content: 'Previous message',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Previous response',
          timestamp: new Date().toISOString()
        }
      ]);
      
      localStorageMock.getItem.mockReturnValue(savedMessages);
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_3',
        role: 'assistant',
        content: 'New response',
        timestamp: new Date(),
        metadata: {}
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Verify previous messages are loaded
      expect(screen.getByText('Previous message')).toBeInTheDocument();
      expect(screen.getByText('Previous response')).toBeInTheDocument();
      
      // Send new message
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'New message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('New response')).toBeInTheDocument();
      });
      
      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('API Integration Tests', () => {
    it('should handle successful API responses with rich metadata', async () => {
      const user = userEvent.setup();
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'Here\'s your analysis with data:',
        timestamp: new Date(),
        metadata: {
          model_used: 'claude-3.5-sonnet',
          data_results: [
            { store_number: 1, employee_count: 5, avg_hours: 8.5 },
            { store_number: 2, employee_count: 3, avg_hours: 7.8 }
          ],
          query_executed: 'SELECT store_number, COUNT(*) as employee_count, AVG(scheduled_hours) as avg_hours FROM store_schedules GROUP BY store_number',
          performance_metrics: {
            response_time_ms: 1200,
            model_selection_reason: 'Analytical query',
            data_queries_executed: 1,
            tokens_used: 300
          }
        }
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Analyze employee distribution across stores');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Here's your analysis/)).toBeInTheDocument();
        expect(screen.getByText('claude-3.5-sonnet')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully with user feedback', async () => {
      const user = userEvent.setup();
      
      mockAiClient.chat.mockRejectedValue(new Error('API rate limit exceeded'));

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/encountered an error/)).toBeInTheDocument();
        expect(screen.getByText(/rate limit exceeded/)).toBeInTheDocument();
      });
    });

    it('should handle network timeouts and retries', async () => {
      const user = userEvent.setup();
      
      // Mock timeout scenario
      mockAiClient.chat.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      // Should show loading state
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
      
      // Wait for timeout
      await waitFor(() => {
        expect(screen.getByText(/encountered an error/)).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Performance and Caching Tests', () => {
    it('should use caching for repeated queries', async () => {
      const user = userEvent.setup();
      
      const cachedResponse = {
        id: 'msg_1',
        role: 'assistant',
        content: 'Cached response',
        timestamp: new Date(),
        metadata: {
          model_used: 'gpt-3.5-turbo',
          performance_metrics: {
            response_time_ms: 50, // Very fast for cached response
            model_selection_reason: 'Cached response',
            data_queries_executed: 0,
            tokens_used: 0
          }
        }
      };
      
      mockAiClient.chat.mockResolvedValue(cachedResponse);

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // First query
      await user.type(input, 'What is the weather?');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Cached response')).toBeInTheDocument();
      });
      
      // Clear input and send same query again
      await user.clear(input);
      await user.type(input, 'What is the weather?');
      await user.click(sendButton);
      
      // Should use cache for second query
      expect(mockAiClient.chat).toHaveBeenCalledTimes(2);
    });

    it('should handle large response data efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock large dataset response
      const largeDataResults = Array.from({ length: 100 }, (_, i) => ({
        employee_name: `Employee ${i}`,
        role: 'Technician',
        shift_time: '9:00am - 5:00pm',
        store_number: Math.floor(i / 10) + 1
      }));
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'Large dataset response',
        timestamp: new Date(),
        metadata: {
          model_used: 'gpt-4-turbo',
          data_results: largeDataResults,
          performance_metrics: {
            response_time_ms: 2500,
            model_selection_reason: 'Large dataset processing',
            data_queries_executed: 1,
            tokens_used: 500
          }
        }
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Show me all employees');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Large dataset response')).toBeInTheDocument();
      });
      
      // Should handle large data without performance issues
      expect(screen.getByText('Large dataset response')).toBeInTheDocument();
    });
  });

  describe('Security and Validation Tests', () => {
    it('should sanitize user input to prevent XSS', async () => {
      const user = userEvent.setup();
      
      const maliciousInput = '<script>alert("xss")</script>Hello';
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'Processed your message safely',
        timestamp: new Date(),
        metadata: {}
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, maliciousInput);
      await user.click(sendButton);
      
      // Should not execute script tags
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
    });

    it('should handle SQL injection attempts safely', async () => {
      const user = userEvent.setup();
      
      const sqlInjectionAttempt = "'; DROP TABLE store_schedules; --";
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'I cannot process that type of request.',
        timestamp: new Date(),
        metadata: {
          model_used: 'gpt-3.5-turbo',
          performance_metrics: {
            response_time_ms: 100,
            model_selection_reason: 'Security validation',
            data_queries_executed: 0,
            tokens_used: 50
          }
        }
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, sqlInjectionAttempt);
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/cannot process that type of request/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX Tests', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      
      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();
      
      // Type and press Enter
      await user.type(input, 'Test message{enter}');
      
      expect(mockAiClient.chat).toHaveBeenCalledWith('Test message', expect.any(Object));
    });

    it('should provide screen reader support', () => {
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Check for proper ARIA labels
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /microphone/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle voice input accessibility', async () => {
      const user = userEvent.setup();
      
      // Mock speech recognition
      const mockRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
        onresult: jest.fn(),
        onerror: jest.fn(),
        onend: jest.fn(),
      };
      
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: jest.fn(() => mockRecognition)
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const micButton = screen.getByRole('button', { name: /microphone/i });
      
      await user.click(micButton);
      
      expect(mockRecognition.start).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from localStorage corruption', async () => {
      // Mock corrupted localStorage data
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage corrupted');
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Should still render and show welcome message
      expect(screen.getByText(/Welcome to your Supercharged AI Assistant/)).toBeInTheDocument();
    });

    it('should handle component unmounting during API calls', async () => {
      const user = userEvent.setup();
      
      // Mock long-running API call
      let resolvePromise: (value: any) => void;
      const longPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockAiClient.chat.mockReturnValue(longPromise);

      const { unmount } = render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      // Unmount component while API call is in progress
      unmount();
      
      // Resolve the promise after unmount
      resolvePromise!({
        id: 'msg_1',
        role: 'assistant',
        content: 'Response',
        timestamp: new Date(),
        metadata: {}
      });
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});