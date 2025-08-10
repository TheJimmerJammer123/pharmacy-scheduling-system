export interface SendSMSRequest {
  to: string;
  message: string;
  contactId?: string;
}

export interface SendSMSResponse {
  id: string;
  to: string;
  from: string;
  message: string;
  status: string;
  timestamp: string;
  contactId?: string;
  dbId?: string;
}

export interface Message {
  id: string;
  contact_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  capcom6_message_id?: string;
  created_at: string;
  contact_name?: string;
  contact_phone?: string;
}

export class SMSApiClient {
  private static getBaseURL(): string {
    const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
    if (envUrl && envUrl.trim().length > 0) return envUrl;
    try {
      const protocol = typeof window !== 'undefined' && window.location?.protocol ? window.location.protocol : 'http:';
      const hostname = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
      const port = '3001';
      return `${protocol}//${hostname}:${port}`;
    } catch (_) {
      return 'http://localhost:3001';
    }
  }

  private static getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private static getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // SMS sending via our Node.js backend
  static async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse | { success: false; error: string }> {
    try {
      const response = await fetch(`${this.getBaseURL()}/api/send-sms`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          to: request.to,
          message: request.message,
          contactId: request.contactId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Failed to send SMS'
        };
      }

      const result = await response.json();
      return result as SendSMSResponse;

    } catch (error: any) {
      console.error('SMS API error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Get messages for a contact
  static async getContactMessages(contactId: string): Promise<{ success: boolean; data?: Message[]; error?: string }> {
    try {
      const response = await fetch(`${this.getBaseURL()}/api/messages/${contactId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to fetch messages' };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Set auth token (called after login)
  static setAuthToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  // Clear auth token (called on logout)
  static clearAuthToken() {
    localStorage.removeItem('authToken');
  }
}