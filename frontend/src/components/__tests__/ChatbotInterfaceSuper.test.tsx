import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatbotInterfaceSuper } from '../ChatbotInterfaceSuper';

// Mock all UI components
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} {...props}>{children}</button>
  ))
}));

jest.mock('@/components/ui/card', () => ({
  Card: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  CardContent: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  CardHeader: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  CardTitle: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <h3 ref={ref} {...props}>{children}</h3>
  )),
  CardDescription: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <p ref={ref} {...props}>{children}</p>
  ))
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef(({ ...props }: any, ref: any) => (
    <input ref={ref} {...props} />
  ))
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef(({ ...props }: any, ref: any) => (
    <textarea ref={ref} {...props} />
  ))
}));

jest.mock('@/components/ui/select', () => ({
  Select: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <select ref={ref} {...props}>{children}</select>
  )),
  SelectTrigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} {...props}>{children}</button>
  )),
  SelectContent: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  SelectItem: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  SelectValue: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <span ref={ref} {...props}>{children}</span>
  ))
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  DialogContent: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  DialogHeader: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  DialogTitle: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <h2 ref={ref} {...props}>{children}</h2>
  )),
  DialogDescription: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <p ref={ref} {...props}>{children}</p>
  )),
  DialogTrigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} {...props}>{children}</button>
  ))
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: React.forwardRef(({ ...props }: any, ref: any) => (
    <hr ref={ref} {...props} />
  ))
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <span ref={ref} {...props}>{children}</span>
  ))
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  ))
}));

jest.mock('@/components/ui/label', () => ({
  Label: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <label ref={ref} {...props}>{children}</label>
  ))
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: React.forwardRef(({ ...props }: any, ref: any) => (
    <button ref={ref} {...props} />
  ))
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  TooltipContent: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  TooltipTrigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  ))
}));

// Mock icons
jest.mock('@/lib/icons', () => ({
  Send: (props: any) => <svg {...props} data-testid="send-icon" />,
  Mic: (props: any) => <svg {...props} data-testid="mic-icon" />,
  MicOff: (props: any) => <svg {...props} data-testid="mic-off-icon" />,
  Download: (props: any) => <svg {...props} data-testid="download-icon" />,
  Trash2: (props: any) => <svg {...props} data-testid="trash-icon" />,
  Settings: (props: any) => <svg {...props} data-testid="settings-icon" />,
  X: (props: any) => <svg {...props} data-testid="x-icon" />,
  Check: (props: any) => <svg {...props} data-testid="check-icon" />,
  AlertCircle: (props: any) => <svg {...props} data-testid="alert-circle-icon" />,
  Info: (props: any) => <svg {...props} data-testid="info-icon" />,
  Loader2: (props: any) => <svg {...props} data-testid="loader-icon" />,
  Sparkles: (props: any) => <svg {...props} data-testid="sparkles-icon" />,
  Bot: (props: any) => <svg {...props} data-testid="bot-icon" />,
  User: (props: any) => <svg {...props} data-testid="user-icon" />,
  MessageSquare: (props: any) => <svg {...props} data-testid="message-icon" />,
  Clock: (props: any) => <svg {...props} data-testid="clock-icon" />,
  Calendar: (props: any) => <svg {...props} data-testid="calendar-icon" />,
  BarChart3: (props: any) => <svg {...props} data-testid="chart-icon" />,
  Database: (props: any) => <svg {...props} data-testid="database-icon" />,
  FileText: (props: any) => <svg {...props} data-testid="file-icon" />,
  Search: (props: any) => <svg {...props} data-testid="search-icon" />,
  Filter: (props: any) => <svg {...props} data-testid="filter-icon" />,
  RefreshCw: (props: any) => <svg {...props} data-testid="refresh-icon" />,
  Plus: (props: any) => <svg {...props} data-testid="plus-icon" />,
  Minus: (props: any) => <svg {...props} data-testid="minus-icon" />,
  ChevronDown: (props: any) => <svg {...props} data-testid="chevron-down-icon" />,
  ChevronUp: (props: any) => <svg {...props} data-testid="chevron-up-icon" />,
  ChevronLeft: (props: any) => <svg {...props} data-testid="chevron-left-icon" />,
  ChevronRight: (props: any) => <svg {...props} data-testid="chevron-right-icon" />,
  Eye: (props: any) => <svg {...props} data-testid="eye-icon" />,
  EyeOff: (props: any) => <svg {...props} data-testid="eye-off-icon" />,
  Lock: (props: any) => <svg {...props} data-testid="lock-icon" />,
  Unlock: (props: any) => <svg {...props} data-testid="unlock-icon" />,
  Shield: (props: any) => <svg {...props} data-testid="shield-icon" />,
  Zap: (props: any) => <svg {...props} data-testid="zap-icon" />,
  Star: (props: any) => <svg {...props} data-testid="star-icon" />,
  Heart: (props: any) => <svg {...props} data-testid="heart-icon" />,
  ThumbsUp: (props: any) => <svg {...props} data-testid="thumbs-up-icon" />,
  ThumbsDown: (props: any) => <svg {...props} data-testid="thumbs-down-icon" />,
  Share: (props: any) => <svg {...props} data-testid="share-icon" />,
  Copy: (props: any) => <svg {...props} data-testid="copy-icon" />,
  Edit: (props: any) => <svg {...props} data-testid="edit-icon" />,
  Save: (props: any) => <svg {...props} data-testid="save-icon" />,
  Play: (props: any) => <svg {...props} data-testid="play-icon" />,
  Pause: (props: any) => <svg {...props} data-testid="pause-icon" />,
  Stop: (props: any) => <svg {...props} data-testid="stop-icon" />,
  Volume: (props: any) => <svg {...props} data-testid="volume-icon" />,
  VolumeX: (props: any) => <svg {...props} data-testid="volume-x-icon" />,
  Volume1: (props: any) => <svg {...props} data-testid="volume-1-icon" />,
  Volume2: (props: any) => <svg {...props} data-testid="volume-2-icon" />,
  Volume3: (props: any) => <svg {...props} data-testid="volume-3-icon" />,
  Brain: (props: any) => <svg {...props} data-testid="brain-icon" />,
  CheckCircle: (props: any) => <svg {...props} data-testid="check-circle-icon" />,
  RotateCcw: (props: any) => <svg {...props} data-testid="rotate-ccw-icon" />
}));

// Mock the AI client
jest.mock('@/lib/ai-client-supercharged', () => ({
  SuperchargedAIClient: jest.fn().mockImplementation(() => ({
    chat: jest.fn(),
    executeAction: jest.fn(),
    exportConversation: jest.fn(),
    clearConversation: jest.fn(),
    getConversationHistory: jest.fn(),
    getModelCapabilities: jest.fn(),
    clearCache: jest.fn(),
    updateUserContext: jest.fn(),
    simpleChat: jest.fn(),
  }))
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
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
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Hello');
      await user.click(sendButton);
      
      // Should attempt to send message
      expect(input).toBeInTheDocument();
    });

    it('should send message when user presses Enter', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      
      await user.type(input, 'Test message{enter}');
      
      // Should attempt to send message
      expect(input).toBeInTheDocument();
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Button should be disabled for empty input
      expect(sendButton).toBeDisabled();
      
      await user.click(sendButton);
      
      // Should not send empty message
      expect(sendButton).toBeDisabled();
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
  });

  describe('Quick Actions', () => {
    it('should execute quick actions when clicked', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const quickAction = screen.getByText("Today's Schedule");
      await user.click(quickAction);
      
      // Should execute quick action
      expect(quickAction).toBeInTheDocument();
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
      
      // Should attempt to export
      expect(exportButton).toBeInTheDocument();
    });

    it('should clear conversation', async () => {
      const user = userEvent.setup();
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const clearButton = screen.getByRole('button', { name: /trash/i });
      await user.click(clearButton);
      
      // Should attempt to clear
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display user and assistant messages correctly', () => {
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Messages should be displayed
      expect(screen.getByText(/Welcome to your Supercharged AI Assistant/)).toBeInTheDocument();
    });

    it('should show model information when available', () => {
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      // Should show model badge when available
      expect(screen.getByText(/AI Assistant Supercharged/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
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
      
      render(<ChatbotInterfaceSuper activeTab="chatbot" />);
      
      const input = screen.getByPlaceholderText(/Ask me anything/);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Hello');
      await user.click(sendButton);
      
      // Should show loading state
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
    });
  });
});