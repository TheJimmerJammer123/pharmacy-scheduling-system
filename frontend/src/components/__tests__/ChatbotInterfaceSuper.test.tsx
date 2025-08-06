import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotInterfaceSuper } from '../ChatbotInterfaceSuper';
import { SuperchargedAIClient } from '@/lib/ai-client-supercharged';

// Mock the AI client
jest.mock('@/lib/ai-client-supercharged');
const MockSuperchargedAIClient = SuperchargedAIClient as jest.MockedClass<typeof SuperchargedAIClient>;

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
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

// Mock speech recognition
Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: jest.fn().mockImplementation(() => ({
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    start: jest.fn(),
    stop: jest.fn(),
    onresult: jest.fn(),
    onerror: jest.fn(),
    onend: jest.fn(),
  }))
});

describe('ChatbotInterfaceSuper', () => {
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

  describe('Component Initialization', () => {
    it('should render without crashing', () => {
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      expect(screen.getByText(/AI Assistant Supercharged/)).toBeInTheDocument();
    });

    it('should display welcome message on first load', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      expect(screen.getByText(/Welcome to your Supercharged AI Assistant/)).toBeInTheDocument();
    });

    it('should load conversation from localStorage', () => {
      const savedMessages = JSON.stringify([
        {
          id: 'msg_1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date().toISOString()
        }
      ]);
      
      localStorageMock.getItem.mockReturnValue(savedMessages);
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('should send message when user types and clicks send', async () => {
      const user = userEvent.setup();
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'Hello! How can I help you?',
        timestamp: new Date(),
        metadata: {
          model_used: 'gpt-4-turbo',
          performance_metrics: {
            response_time_ms: 1000,
            model_selection_reason: 'Auto selected',
            data_queries_executed: 0,
            tokens_used: 100
          }
        }
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Hello');
      await user.click(sendButton);
      
      expect(mockAiClient.chat).toHaveBeenCalledWith('Hello', expect.objectContaining({
        userId: undefined
      }));
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
      });
    });

    it('should send message when user presses Enter', async () => {
      const user = userEvent.setup();
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'Response',
        timestamp: new Date(),
        metadata: {}
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      
      await user.type(input, 'Test message{enter}');
      
      expect(mockAiClient.chat).toHaveBeenCalledWith('Test message', expect.any(Object));
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Button should be disabled for empty input
      expect(sendButton).toBeDisabled();
      
      await user.click(sendButton);
      
      expect(mockAiClient.chat).not.toHaveBeenCalled();
    });

    it('should handle AI client errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAiClient.chat.mockRejectedValue(new Error('API Error'));
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Hello');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });
    });
  });

  describe('Voice Input', () => {
    it('should toggle voice input when microphone button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const micButton = screen.getByRole('button', { name: /microphone/i });
      
      await user.click(micButton);
      
      // Should show listening state
      expect(screen.getByRole('button', { name: /microphone off/i })).toBeInTheDocument();
    });

    it('should handle speech recognition errors', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const micButton = screen.getByRole('button', { name: /microphone/i });
      
      // Simulate speech recognition error
      const mockRecognition = (window as any).webkitSpeechRecognition.mock.results[0];
      mockRecognition.onerror({ error: 'not-allowed' });
      
      await user.click(micButton);
      
      // Should handle error gracefully
      expect(micButton).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should execute quick actions when clicked', async () => {
      const user = userEvent.setup();
      
      mockAiClient.chat.mockResolvedValue({
        id: 'msg_1',
        role: 'assistant',
        content: 'Schedule data',
        timestamp: new Date(),
        metadata: {}
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const quickAction = screen.getByText("Today's Schedule");
      await user.click(quickAction);
      
      // Should auto-send the quick action prompt
      await waitFor(() => {
        expect(mockAiClient.chat).toHaveBeenCalledWith(
          "Show me today's employee schedules across all stores",
          expect.any(Object)
        );
      });
    });
  });

  describe('Settings and Configuration', () => {
    it('should allow model selection', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const modelSelect = screen.getByRole('combobox');
      await user.click(modelSelect);
      
      // Should show model options
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    });

    it('should toggle settings options', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      // Should show settings dialog
      expect(screen.getByText('AI Assistant Settings')).toBeInTheDocument();
    });
  });

  describe('Conversation Management', () => {
    it('should export conversation', async () => {
      const user = userEvent.setup();
      
      mockAiClient.exportConversation.mockReturnValue({
        conversation_id: 'test_conv',
        messages: [],
        exported_at: new Date().toISOString()
      });

      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = jest.fn();
      const mockRevokeObjectURL = jest.fn();
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      document.createElement = jest.fn().mockReturnValue({
        click: mockClick,
        href: '',
        download: ''
      });
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const exportButton = screen.getByRole('button', { name: /download/i });
      await user.click(exportButton);
      
      expect(mockAiClient.exportConversation).toHaveBeenCalled();
    });

    it('should clear conversation', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const clearButton = screen.getByRole('button', { name: /trash/i });
      await user.click(clearButton);
      
      expect(mockAiClient.clearConversation).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Message Display', () => {
    it('should display user and assistant messages correctly', () => {
      const messages = [
        {
          id: 'msg_1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date()
        },
        {
          id: 'msg_2',
          role: 'assistant' as const,
          content: 'Hi there!',
          timestamp: new Date(),
          metadata: {
            model_used: 'gpt-4-turbo'
          }
        }
      ];

      // Mock the component to have these messages
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Messages should be displayed
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should show model information when available', () => {
      const messages = [
        {
          id: 'msg_1',
          role: 'assistant' as const,
          content: 'Response',
          timestamp: new Date(),
          metadata: {
            model_used: 'gpt-4-turbo'
          }
        }
      ];

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Should show model badge
      expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display initialization error', () => {
      MockSuperchargedAIClient.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      expect(screen.getByText('AI Assistant Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Initialization failed')).toBeInTheDocument();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Should still render without crashing
      expect(screen.getByText(/AI Assistant Supercharged/)).toBeInTheDocument();
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading state while AI is processing', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolveChat: (value: any) => void;
      const chatPromise = new Promise((resolve) => {
        resolveChat = resolve;
      });
      
      mockAiClient.chat.mockReturnValue(chatPromise);

      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Hello');
      await user.click(sendButton);
      
      // Should show loading state
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
      
      // Resolve the promise
      resolveChat!({
        id: 'msg_1',
        role: 'assistant',
        content: 'Response',
        timestamp: new Date(),
        metadata: {}
      });
      
      await waitFor(() => {
        expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument();
      });
    });
  });
});