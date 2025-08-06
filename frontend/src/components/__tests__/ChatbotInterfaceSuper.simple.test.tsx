import React from 'react';
import { render, screen } from '@testing-library/react';
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
  ))
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef(({ ...props }: any, ref: any) => (
    <textarea ref={ref} {...props} />
  ))
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  ))
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <span ref={ref} {...props}>{children}</span>
  ))
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: React.forwardRef(({ ...props }: any, ref: any) => (
    <hr ref={ref} {...props} />
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

jest.mock('@/components/ui/switch', () => ({
  Switch: React.forwardRef(({ ...props }: any, ref: any) => (
    <button ref={ref} {...props} />
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

describe('ChatbotInterfaceSuper - Simple Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<ChatbotInterfaceSuper activeTab="chatbot" />);
    expect(screen.getByText(/AI Assistant Supercharged/)).toBeInTheDocument();
  });

  it('should display welcome message on first load', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<ChatbotInterfaceSuper activeTab="chatbot" />);
    
    expect(screen.getByText(/Welcome to your Supercharged AI Assistant/)).toBeInTheDocument();
  });
});