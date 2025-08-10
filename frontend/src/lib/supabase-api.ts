import { supabase } from './supabase'
import type { Database } from './supabase'

// Type aliases for easier usage
type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']
type MessageUpdate = Database['public']['Tables']['messages']['Update']

type Store = Database['public']['Tables']['stores']['Row']
type StoreInsert = Database['public']['Tables']['stores']['Insert']
type StoreUpdate = Database['public']['Tables']['stores']['Update']

type StoreSchedule = Database['public']['Tables']['store_schedules']['Row']
type StoreScheduleInsert = Database['public']['Tables']['store_schedules']['Insert']
type StoreScheduleUpdate = Database['public']['Tables']['store_schedules']['Update']

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

// API Response interface for compatibility
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

// Legacy interface compatibility
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
  contact_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  ai_generated?: boolean;
}

// Supabase API Client class
export class SupabaseApiClient {
  // Helper method to wrap Supabase responses in ApiResponse format
  private static wrapResponse<T>(data: T | null, error: any): ApiResponse<T> {
    if (error) {
      console.error('[Supabase API Error]:', error);
      return {
        success: false,
        error: error.message || 'Database operation failed'
      };
    }
    
    return {
      success: true,
      data: data as T
    };
  }

  // Contact endpoints
  static async getContacts(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse<Contact[]>> {
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.priority) {
      query = query.eq('priority', params.priority);
    }
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    return this.wrapResponse(data, error);
  }

  static async getContact(id: string): Promise<ApiResponse<Contact>> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    return this.wrapResponse(data, error);
  }

  static async createContact(contact: CreateContactRequest): Promise<ApiResponse<Contact>> {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        priority: contact.priority || 'medium',
        notes: contact.notes,
        total_messages: 0,
        total_appointments: 0
      })
      .select()
      .single();

    return this.wrapResponse(data, error);
  }

  static async updateContact(id: string | number, contact: UpdateContactRequest): Promise<ApiResponse<Contact>> {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single();

    return this.wrapResponse(data, error);
  }

  static async deleteContact(id: string | number): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    return this.wrapResponse(null, error);
  }

  // Message endpoints
  static async getMessages(contactId?: string): Promise<ApiResponse<Message[]>> {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;
    return this.wrapResponse(data, error);
  }

  static async getContactMessages(contactId: string | number): Promise<ApiResponse<Message[]>> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', contactId.toString())
      .order('created_at', { ascending: true });

    return this.wrapResponse(data, error);
  }

  static async createMessage(message: CreateMessageRequest): Promise<ApiResponse<Message>> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        contact_id: message.contact_id,
        content: message.content,
        direction: message.direction,
        ai_generated: message.ai_generated || false,
        status: 'pending'
      })
      .select()
      .single();

    // Update contact total_messages count
    if (data) {
      await supabase.rpc('increment_contact_messages', { 
        contact_id: message.contact_id 
      });
    }

    return this.wrapResponse(data, error);
  }

  static async deleteMessage(id: string | number): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    return this.wrapResponse(null, error);
  }

  static async sendSMS(contactId: string | number, message: string, requiresAcknowledgment?: boolean): Promise<ApiResponse<any>> {
    try {
      // Use the Edge Function to send SMS via Capcom6
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          contactId: contactId.toString(),
          message,
          requiresAcknowledgment: requiresAcknowledgment || false
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to send SMS'
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error sending SMS'
      };
    }
  }

  // Get contacts with last message info
  static async getContactsWithMessages(): Promise<ApiResponse<ContactWithLastMessage[]>> {
    const [contactsResponse, messagesResponse] = await Promise.all([
      this.getContacts(),
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
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  // Store management methods
  static async getAllStores(): Promise<ApiResponse<Store[]>> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('store_number');

    return this.wrapResponse(data, error);
  }

  static async getStore(storeNumber: number): Promise<ApiResponse<Store>> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('store_number', storeNumber)
      .single();

    return this.wrapResponse(data, error);
  }

  static async getStoresByState(state: string): Promise<ApiResponse<Store[]>> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('state', state)
      .eq('is_active', true)
      .order('city');

    return this.wrapResponse(data, error);
  }

  static async searchStoresByCity(city: string): Promise<ApiResponse<Store[]>> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .ilike('city', `%${city}%`)
      .eq('is_active', true)
      .order('city');

    return this.wrapResponse(data, error);
  }

  // Store scheduling endpoints
  static async getAllStoreSchedules(): Promise<ApiResponse<StoreSchedule[]>> {
    const { data, error } = await supabase
      .from('store_schedules')
      .select('*')
      .order('date', { ascending: false });

    return this.wrapResponse(data, error);
  }

  static async getStoreSchedules(storeNumber: number): Promise<ApiResponse<StoreSchedule[]>> {
    const { data, error } = await supabase
      .from('store_schedules')
      .select('*')
      .eq('store_number', storeNumber)
      .order('date', { ascending: false });

    return this.wrapResponse(data, error);
  }

  static async getStoreSchedulesByDateRange(
    startDate: string, 
    endDate: string, 
    storeNumber?: number
  ): Promise<ApiResponse<StoreSchedule[]>> {
    let query = supabase
      .from('store_schedules')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (storeNumber) {
      query = query.eq('store_number', storeNumber);
    }

    const { data, error } = await query.order('date');
    return this.wrapResponse(data, error);
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
  }): Promise<ApiResponse<StoreSchedule>> {
    // First get the store_id from store_number
    const storeResponse = await this.getStore(schedule.store_number);
    if (!storeResponse.success || !storeResponse.data) {
      return {
        success: false,
        error: 'Store not found'
      };
    }

    const { data, error } = await supabase
      .from('store_schedules')
      .insert({
        store_id: storeResponse.data.id,
        store_number: schedule.store_number,
        date: schedule.date,
        employee_name: schedule.employee_name || 'TBD',
        employee_id: schedule.employee_id,
        role: schedule.role,
        employee_type: schedule.employee_type,
        scheduled_hours: schedule.scheduled_hours,
        shift_time: schedule.shift_time || 'TBD',
        notes: schedule.notes
      })
      .select()
      .single();

    return this.wrapResponse(data, error);
  }

  static async updateStoreSchedule(id: string, schedule: StoreScheduleUpdate): Promise<ApiResponse<StoreSchedule>> {
    const { data, error } = await supabase
      .from('store_schedules')
      .update(schedule)
      .eq('id', id)
      .select()
      .single();

    return this.wrapResponse(data, error);
  }

  static async deleteStoreSchedule(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('store_schedules')
      .delete()
      .eq('id', id);

    return this.wrapResponse(null, error);
  }

  // Dashboard stats - simplified for now
  static async getDashboardStats(): Promise<ApiResponse<any>> {
    const [contactsCount, messagesCount, storesCount] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true })
    ]);

    const stats = {
      contacts: {
        total: contactsCount.count || 0,
        active: contactsCount.count || 0, // Simplified
        high_priority: 0 // Simplified
      },
      messages: {
        total: messagesCount.count || 0,
        sent_today: 0, // Would need more complex query
        pending: 0,
        unread: 0
      },
      stores: {
        total: storesCount.count || 0,
        active: storesCount.count || 0,
        scheduled_today: 0
      }
    };

    return {
      success: true,
      data: stats
    };
  }

  // Daily Summary methods temporarily disabled
  static async getDailySummary(): Promise<ApiResponse<any>> {
    return { success: true, data: null };
  }

  static async generateDailySummary(): Promise<ApiResponse<any>> {
    return { success: false, error: 'Daily summary feature is disabled' };
  }

  static async updateDailySummary(_date: string, _markdownContent: string): Promise<ApiResponse<any>> {
    return { success: false, error: 'Daily summary feature is disabled' };
  }

  // Health check - always return success for Supabase
  static async healthCheck(): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: { status: 'healthy', service: 'supabase' }
    };
  }

  // Authentication methods
  static async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    return this.wrapResponse(data, error);
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return this.wrapResponse(data, error);
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return this.wrapResponse(null, error);
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return this.wrapResponse(user, error);
  }

  static async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return this.wrapResponse(session, error);
  }

  // Employee scheduling methods
  static async getAllEmployees(): Promise<ApiResponse<Array<{ employee_name: string }>>> {
    // Use the contacts table since employees are stored there
    const { data, error } = await supabase
      .from('contacts')
      .select('name')
      .order('name');

    if (error) {
      return this.wrapResponse(null, error);
    }

    // Transform contacts to employee format
    const employees = (data || []).map(contact => ({
      employee_name: contact.name
    }));

    return {
      success: true,
      data: employees
    };
  }

  static async getEmployeeSchedules(employeeName: string, startDate?: string, endDate?: string): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('store_schedules')
      .select('*')
      .eq('employee_name', employeeName);
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data: schedules, error } = await query.order('date');
    
    if (error) {
      return this.wrapResponse(null, error);
    }

    if (!schedules || schedules.length === 0) {
      return this.wrapResponse([], null);
    }

    // Get store information separately for each unique store_number
    const storeNumbers = [...new Set(schedules.map(s => s.store_number))];
    const storePromises = storeNumbers.map(storeNumber => 
      supabase
        .from('stores')
        .select('store_number, address, city, state')
        .eq('store_number', storeNumber)
        .single()
    );

    const storeResults = await Promise.all(storePromises);
    
    // Create a map of store_number to store info
    const storeMap = new Map();
    storeResults.forEach(({ data: store, error: storeError }) => {
      if (!storeError && store) {
        storeMap.set(store.store_number, store);
      }
    });

    // Transform the data to include store information
    const transformedData = schedules.map(schedule => {
      const store = storeMap.get(schedule.store_number);
      return {
        ...schedule,
        store_name: store ? `${store.city}, ${store.state}` : `Store #${schedule.store_number}`,
        store_address: store?.address || 'Unknown Address'
      };
    });

    // Deduplicate based on unique combination of employee_name, date, store_number, and shift_time
    // Keep the most recently created record for each duplicate set
    const deduplicatedData = transformedData.reduce((acc, current) => {
      const key = `${current.employee_name}-${current.date}-${current.store_number}-${current.shift_time}`;
      const existing = acc.get(key);
      
      if (!existing || new Date(current.created_at) > new Date(existing.created_at)) {
        acc.set(key, current);
      }
      
      return acc;
    }, new Map());

    const finalData = Array.from(deduplicatedData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return this.wrapResponse(finalData, null);
  }

  static async getEmployeeNotes(employeeName: string): Promise<ApiResponse<Array<{ notes: string }>>> {
    const { data, error } = await supabase
      .from('contacts')
      .select('notes')
      .eq('name', employeeName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return this.wrapResponse(null, error);
    }

    return {
      success: true,
      data: data ? [{ notes: data.notes || '' }] : []
    };
  }

  static async saveEmployeeNotes(employeeName: string, notes: string): Promise<ApiResponse<any>> {
    const { data, error } = await supabase
      .from('contacts')
      .update({ notes: notes })
      .eq('name', employeeName)
      .select()
      .single();

    return this.wrapResponse(data, error);
  }
}

// For backward compatibility, export as ApiClient
export const ApiClient = SupabaseApiClient;

// Export types for use in components
export type { Contact, Message, Store, StoreSchedule, Appointment };
export type { ContactInsert, MessageInsert, StoreInsert, StoreScheduleInsert, AppointmentInsert };
export type { ContactUpdate, MessageUpdate, StoreUpdate, StoreScheduleUpdate, AppointmentUpdate };