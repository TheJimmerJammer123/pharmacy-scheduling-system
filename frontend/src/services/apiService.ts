import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for our API responses
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  total_messages: number;
  total_appointments: number;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  contact_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  capcom6_message_id?: string;
  ai_generated: boolean;
  requires_acknowledgment: boolean;
  acknowledgment_code?: string;
  acknowledged_at?: string;
  acknowledgment_message_id?: string;
  metadata?: any;
  created_at: string;
  contact_name?: string;
  contact_phone?: string;
}

export interface Store {
  id: string;
  store_number: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  pharmacy_hours?: string;
  store_hours?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  contact_id: string;
  title: string;
  description?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  location?: string;
  notes?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  contact_name?: string;
  contact_phone?: string;
}

export interface SmsRequest {
  to: string;
  message: string;
  contactId?: string;
}

export interface SmsResponse {
  id: string;
  to: string;
  from: string;
  message: string;
  status: string;
  timestamp: string;
  contactId?: string;
  dbId?: string;
}

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize auth token from localStorage on startup
    try {
      const existingToken = localStorage.getItem('authToken');
      if (existingToken) {
        this.authToken = existingToken;
      }
    } catch (_) {
      // no-op if localStorage is not available
    }

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        // Ensure we always have the latest token from localStorage
        if (!this.authToken) {
          try {
            this.authToken = localStorage.getItem('authToken');
          } catch (_) {
            // ignore
          }
        }
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('authToken');
    }
    return this.authToken;
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response: AxiosResponse = await this.api.get('/api/health');
    return response.data;
  }

  // SMS operations
  async sendSms(smsData: SmsRequest): Promise<SmsResponse> {
    const response: AxiosResponse<SmsResponse> = await this.api.post('/api/send-sms', smsData);
    return response.data;
  }

  // Contact operations
  async getContacts(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<Contact[]> {
    const response: AxiosResponse<Contact[]> = await this.api.get('/api/contacts', { params });
    return response.data;
  }

  async getContact(id: string): Promise<Contact> {
    const response: AxiosResponse<Contact> = await this.api.get(`/api/contacts/${id}`);
    return response.data;
  }

  async createContact(contactData: {
    name: string;
    phone: string;
    email?: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    status?: 'active' | 'inactive';
  }): Promise<Contact> {
    const response: AxiosResponse<Contact> = await this.api.post('/api/contacts', contactData);
    return response.data;
  }

  async updateContact(id: string, contactData: {
    name: string;
    phone: string;
    email?: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    status?: 'active' | 'inactive';
  }): Promise<Contact> {
    const response: AxiosResponse<Contact> = await this.api.put(`/api/contacts/${id}`, contactData);
    return response.data;
  }

  async deleteContact(id: string): Promise<boolean> {
    await this.api.delete(`/api/contacts/${id}`);
    return true;
  }

  // Message operations
  async getMessages(contactId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<Message[]> {
    const response: AxiosResponse<Message[]> = await this.api.get(`/api/messages/${contactId}`, { params });
    return response.data;
  }

  async deleteMessage(id: string | number): Promise<boolean> {
    await this.api.delete(`/api/messages/${id}`);
    return true;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    const response: AxiosResponse<Store[]> = await this.api.get('/api/stores');
    return response.data;
  }

  async getStore(id: string): Promise<Store> {
    const response: AxiosResponse<Store> = await this.api.get(`/api/stores/${id}`);
    return response.data;
  }

  // Note: Employee data is extracted from schedule entries in components

  // Schedule entries (backend uses /api/schedule-entries)
  async getAllStoreSchedules(params?: { employee_name?: string; store_number?: number; date_from?: string; date_to?: string; }): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/api/schedule-entries', { params });
    return response.data;
  }

  async createStoreSchedule(data: { store_number: number; date: string; employee_name: string; shift_time: string; notes?: string; employee_id?: string; role?: string; employee_type?: string; scheduled_hours?: number; }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/api/schedule-entries', data);
    return response.data;
  }

  async updateStoreSchedule(id: number, data: { store_number: number; date: string; employee_name: string; shift_time: string; notes?: string; employee_id?: string; role?: string; employee_type?: string; scheduled_hours?: number; }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/api/schedule-entries/${id}`, data);
    return response.data;
  }

  async deleteStoreSchedule(id: number): Promise<boolean> {
    await this.api.delete(`/api/schedule-entries/${id}`);
    return true;
  }

  // Appointment operations
  async getAppointments(params?: {
    contactId?: string;
    date?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const response: AxiosResponse<Appointment[]> = await this.api.get('/api/appointments', { params });
    return response.data;
  }

  async getAppointment(id: string): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.get(`/api/appointments/${id}`);
    return response.data;
  }

  // Document ingestion
  async processExcelDocument(payload: { import_id?: string; file_name: string; file_type: 'excel' | 'xlsx' | 'xls'; content: string; }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/api/documents/process-excel', payload);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getBaseURL(): string {
    return this.api.defaults.baseURL || '';
  }
}

export const apiService = new ApiService();
export default apiService;
