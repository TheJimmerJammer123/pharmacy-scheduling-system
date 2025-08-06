import { supabase } from './supabase';

export interface SendSMSRequest {
  contactId: string;
  message: string;
  requiresAcknowledgment?: boolean;
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  capcom6MessageId?: string;
  error?: string;
}

export class SMSApiClient {
  // SMS sending via Supabase Edge Function (handles CORS and server-side Capcom6 calls)
  static async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://100.120.219.68:8002';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          contactId: request.contactId,
          message: request.message,
          requiresAcknowledgment: request.requiresAcknowledgment || false
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
        success: result.success,
        messageId: result.messageId,
        capcom6MessageId: result.capcom6MessageId,
        error: result.success ? undefined : result.error
      };

    } catch (error: any) {
      console.error('SMS API error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Get messages for a contact
  static async getContactMessages(contactId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  // Delete a message
  static async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}