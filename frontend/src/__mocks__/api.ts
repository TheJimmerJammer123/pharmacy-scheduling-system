// Mock API client for testing
export const ApiClient = {
  getContacts: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        name: 'Test Contact',
        phone: '+1234567890',
        email: 'test@example.com',
        status: 'active',
        priority: 'medium',
        total_messages: 5,
        total_appointments: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  getMessages: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        contact_id: 1,
        content: 'Test message',
        direction: 'inbound',
        status: 'read',
        ai_generated: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  getDashboardStats: jest.fn().mockResolvedValue({
    success: true,
    data: {
      contacts: {
        total: 1,
        active: 1,
        high_priority: 0,
      },
      messages: {
        total: 1,
        today: 1,
        pending: 0,
        ai_generated: 0,
      },
      appointments: {
        total: 2,
        today: 0,
        pending: 0,
        confirmed: 2,
      },
    },
  }),
  
  getDailySummary: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      date: '2024-01-01',
      summary: 'Test summary',
      key_points: ['Point 1', 'Point 2'],
      action_items: ['Action 1', 'Action 2'],
      contacts: ['Contact 1'],
      markdown_content: '# Test Summary\n\nThis is a test summary.',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  }),
  
  generateDailySummary: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      date: '2024-01-01',
      summary: 'Generated summary',
      key_points: ['Generated point 1'],
      action_items: ['Generated action 1'],
      contacts: ['Generated contact 1'],
      markdownContent: '# Generated Summary\n\nThis is a generated summary.',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  }),
  
  updateDailySummary: jest.fn().mockResolvedValue({
    success: true,
    data: { message: 'Summary updated successfully' },
  }),
  
  getAllDailySummaries: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        date: '2024-01-01',
        summary: 'Test summary',
        key_points: ['Point 1'],
        action_items: ['Action 1'],
        contacts: ['Contact 1'],
        markdown_content: '# Test Summary',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  deleteDailySummary: jest.fn().mockResolvedValue({
    success: true,
    data: { message: 'Summary deleted successfully' },
  }),
  
  getAllStores: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        store_number: 1,
        address: '123 Test St',
        city: 'Test City',
        state: 'NY',
        zip_code: '12345',
        phone: '+1234567890',
        pharmacy_hours: '9 AM - 6 PM',
        store_hours: '8 AM - 8 PM',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  getAllStoreSchedules: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        store_number: 1,
        date: '2024-01-01',
        employee_name: 'Test Employee',
        shift_time: '9 AM - 5 PM',
        notes: 'Test schedule',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  getContactsWithMessages: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        name: 'Test Contact',
        phone: '+1234567890',
        email: 'test@example.com',
        status: 'active',
        priority: 'medium',
        total_messages: 5,
        total_appointments: 2,
        lastMessage: 'Test message',
        lastMessageTime: '2 hours ago',
        unreadCount: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  getContactMessages: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        contact_id: 1,
        content: 'Test message',
        direction: 'inbound',
        status: 'read',
        ai_generated: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  
  sendSMS: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 2,
      contact_id: 1,
      content: 'Test SMS',
      direction: 'outbound',
      status: 'sent',
      ai_generated: false,
      created_at: '2024-01-01T00:00:00Z',
    },
  }),
  
  summarizeConversation: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      summary: 'Test conversation summary',
      keyPoints: ['Key point 1'],
      actionItems: ['Action item 1'],
      priority: 'medium',
    },
  }),
  
  createStoreSchedule: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 2,
      store_number: 1,
      date: '2024-01-02',
      employee_name: 'New Employee',
      shift_time: '10 AM - 6 PM',
      notes: 'New schedule',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  }),
  
  updateStoreSchedule: jest.fn().mockResolvedValue({
    success: true,
    data: { message: 'Schedule updated successfully' },
  }),
  
  deleteStoreSchedule: jest.fn().mockResolvedValue({
    success: true,
    data: { message: 'Schedule deleted successfully' },
  }),
  
  deleteMessage: jest.fn().mockResolvedValue({
    success: true,
    data: { message: 'Message deleted successfully' },
  }),
};

// Mock types
export interface Contact {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  total_messages: number;
  total_appointments: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id?: number;
  contact_id: number;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  twilio_sid?: string;
  ai_generated: boolean;
  requires_acknowledgment?: boolean;
  acknowledgment_code?: string;
  acknowledged_at?: string;
  acknowledgment_message_id?: number;
  created_at?: string;
}

export interface ContactWithLastMessage extends Contact {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}