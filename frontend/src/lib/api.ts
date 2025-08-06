const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types matching backend interfaces
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

export interface CreateContactRequest {
  name: string;
  phone: string;
  email?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UpdateContactRequest {
  name?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface CreateMessageRequest {
  contact_id: number;
  content: string;
  direction: 'inbound' | 'outbound';
  ai_generated?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Extended contact type with messaging info
export interface ContactWithLastMessage extends Contact {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

// API client class
export class ApiClient {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    // Enhanced logging for debugging
    if (import.meta.env.DEV) {
      console.log(`[API DEBUG] Making request to: ${API_BASE_URL}${endpoint}`);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      clearTimeout(timeoutId);

      // Parse response as JSON
      const data = await response.json();
      
      // Log for debugging (only in development)
      if (import.meta.env.DEV) {
        console.log(`[API DEBUG] ${endpoint} status:`, response.status, 'body:', data);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[API] Request timeout for ${endpoint}`);
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      
      if (import.meta.env.DEV) {
        console.error(`[API DEBUG] API request failed: ${endpoint}`, error);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Contact endpoints
  static async getContacts(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse<Contact[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    
    const query = searchParams.toString();
    return this.request<Contact[]>(`/contacts${query ? `?${query}` : ''}`);
  }

  static async getContact(id: number): Promise<ApiResponse<Contact>> {
    return this.request<Contact>(`/contacts/${id}`);
  }

  static async createContact(contact: CreateContactRequest): Promise<ApiResponse<Contact>> {
    return this.request<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  static async updateContact(id: number, contact: UpdateContactRequest): Promise<ApiResponse<Contact>> {
    return this.request<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  static async deleteContact(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  static async getMessages(contactId?: number): Promise<ApiResponse<Message[]>> {
    const endpoint = contactId ? `/messages?contact_id=${contactId}` : '/messages';
    return this.request<Message[]>(endpoint);
  }

  static async getContactMessages(contactId: number): Promise<ApiResponse<Message[]>> {
    return this.request<Message[]>(`/contacts/${contactId}/messages`);
  }

  static async createMessage(message: CreateMessageRequest): Promise<ApiResponse<Message>> {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  static async deleteMessage(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  static async sendSMS(contactId: number, message: string, requiresAcknowledgment?: boolean): Promise<ApiResponse<Message>> {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({
        contact_id: contactId,
        content: message,
        direction: 'outbound',
        requires_acknowledgment: requiresAcknowledgment || false
      }),
    });
  }

  // Get contacts with last message info
  static async getContactsWithMessages(): Promise<ApiResponse<ContactWithLastMessage[]>> {
    const [contactsResponse, messagesResponse] = await Promise.all([
      this.getContacts({ status: 'active' }),
      this.getMessages()
    ]);

    if (!contactsResponse.success || !messagesResponse.success) {
      return {
        success: false,
        error: 'Failed to fetch contacts or messages'
      };
    }

    const contacts = contactsResponse.data || [];
    const messages = messagesResponse.data || [];

    // Enhance contacts with last message info
    const contactsWithMessages: ContactWithLastMessage[] = contacts.map(contact => {
      const contactMessages = messages.filter(m => m.contact_id === contact.id);
      const lastMessage = contactMessages.sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      )[0];

      const unreadCount = contactMessages.filter(m => 
        m.direction === 'inbound' && m.status !== 'read'
      ).length;

      return {
        ...contact,
        lastMessage: lastMessage?.content,
        lastMessageTime: lastMessage?.created_at ? 
          this.formatRelativeTime(lastMessage.created_at) : undefined,
        unreadCount
      };
    });

    return {
      success: true,
      data: contactsWithMessages
    };
  }

  private static formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  // Health check
  static async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('http://localhost:3001/health');
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Backend server is not responding'
      };
    }
  }

  // Dashboard stats
  static async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/stats');
  }

  // Conversation summarization
  static async summarizeConversation(contactId: number, messageIds?: number[]): Promise<ApiResponse<any>> {
    return this.request<any>('/messages/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ contactId, messageIds }),
    });
  }

  // Daily summary management
  static async generateDailySummary(date?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/daily-summary/generate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  static async getDailySummary(date?: string): Promise<ApiResponse<any>> {
    const endpoint = date ? `/dashboard/daily-summary/${date}` : '/dashboard/daily-summary';
    return this.request<any>(endpoint);
  }

  static async updateDailySummary(date: string, markdownContent: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/dashboard/daily-summary/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ markdownContent }),
    });
  }

  static async getAllDailySummaries(): Promise<ApiResponse<any>> {
    return this.request<any>('/dashboard/daily-summaries');
  }

  static async deleteDailySummary(date: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/dashboard/daily-summary/${date}`, {
      method: 'DELETE',
    });
  }

  static async addConversationToDailySummary(date: string, conversationSummary: any, contactId: number, messageIds?: number[]): Promise<ApiResponse<any>> {
    return this.request<any>(`/dashboard/daily-summary/${date}/add-conversation`, {
      method: 'POST',
      body: JSON.stringify({ conversationSummary, contactId, messageIds }),
    });
  }

  // Store scheduling endpoints
  static async getAllStoreSchedules(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/store-schedules');
  }

  static async getStoreSchedules(storeNumber: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/store-schedules/store/${storeNumber}`);
  }

  static async getStoreSchedulesByDateRange(startDate: string, endDate: string, storeNumber?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (storeNumber) {
      params.set('storeNumber', storeNumber.toString());
    }
    return this.request<any[]>(`/store-schedules/date-range?${params.toString()}`);
  }

  static async createStoreSchedule(schedule: {
    store_number: number;
    date: string;
    employee_name?: string;
    employee_id?: string;
    role?: string;
    employee_type?: string;
    scheduled_hours?: number;
    shift_time?: string;
    notes?: string;
    updated_in_better_shifts?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/store-schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  // Store management methods
  static async getAllStores(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/stores');
  }

  static async getStore(storeNumber: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/stores/${storeNumber}`);
  }

  static async getStoresByState(state: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/stores/state/${state}`);
  }

  static async searchStoresByCity(city: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/stores/search/city/${city}`);
  }

  static async getStoreWithSchedules(storeNumber: number, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<any>(`/stores/${storeNumber}/schedules?${params.toString()}`);
  }

  static async updateStore(storeNumber: number, storeData: {
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    pharmacy_hours?: string;
    store_hours?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request<any>(`/stores/${storeNumber}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  }

  static async deactivateStore(storeNumber: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/stores/${storeNumber}`, {
      method: 'DELETE',
    });
  }

  static async updateStoreSchedule(id: number, schedule: {
    store_number?: number;
    date?: string;
    employee_name?: string;
    employee_id?: string;
    role?: string;
    employee_type?: string;
    scheduled_hours?: number;
    shift_time?: string;
    notes?: string;
    updated_in_better_shifts?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request<any>(`/store-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
  }

  static async deleteStoreSchedule(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/store-schedules/${id}`, {
      method: 'DELETE',
    });
  }

  static async bulkCreateStoreSchedules(schedules: Array<{
    store_number: number;
    date: string;
    employee_name?: string;
    shift_time?: string;
    notes?: string;
  }>): Promise<ApiResponse<any>> {
    return this.request<any>('/store-schedules/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ schedules }),
    });
  }

  // Employee-based scheduling endpoints
  static async getEmployeeSchedules(employeeName: string, startDate?: string, endDate?: string): Promise<ApiResponse<any[]>> {
    // Use the store_schedules table and filter by employee_name
    let url = `/store_schedules?employee_name=eq.${encodeURIComponent(employeeName)}`;
    
    if (startDate) {
      url += `&date=gte.${startDate}`;
    }
    if (endDate) {
      url += `&date=lte.${endDate}`;
    }
    
    return this.request<any[]>(url);
  }

  static async getAllEmployees(): Promise<ApiResponse<Array<{ employee_name: string }>>> {
    // Use the contacts table since employees are stored there
    const response = await this.request<Contact[]>('/contacts');
    if (response.success && response.data) {
      // Transform contacts to employee format
      const employees = response.data.map(contact => ({
        employee_name: contact.name
      }));
      return {
        success: true,
        data: employees
      };
    }
    return response as any;
  }

  static async getEmployeeNotes(employeeName: string): Promise<ApiResponse<any[]>> {
    // Get employee notes from contacts table
    const response = await this.request<Contact[]>(`/contacts?name=eq.${encodeURIComponent(employeeName)}`);
    if (response.success && response.data && response.data.length > 0) {
      return {
        success: true,
        data: [{ notes: response.data[0].notes }]
      };
    }
    return {
      success: true,
      data: []
    };
  }

  static async saveEmployeeNotes(employeeName: string, notes: string): Promise<ApiResponse<any>> {
    // Update employee notes in contacts table
    const response = await this.request<Contact[]>(`/contacts?name=eq.${encodeURIComponent(employeeName)}`);
    if (response.success && response.data && response.data.length > 0) {
      const contactId = response.data[0].id;
      return this.request<any>(`/contacts?id=eq.${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
    }
    return {
      success: false,
      error: 'Employee not found'
    };
  }
} 