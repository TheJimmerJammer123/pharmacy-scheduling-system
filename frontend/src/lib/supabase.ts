import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://100.120.219.68:8002'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          status: 'active' | 'inactive'
          priority: 'low' | 'medium' | 'high'
          notes: string | null
          total_messages: number
          total_appointments: number
          ai_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          status?: 'active' | 'inactive'
          priority?: 'low' | 'medium' | 'high'
          notes?: string | null
          total_messages?: number
          total_appointments?: number
          ai_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          status?: 'active' | 'inactive'
          priority?: 'low' | 'medium' | 'high'
          notes?: string | null
          total_messages?: number
          total_appointments?: number
          ai_enabled?: boolean
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          contact_id: string
          content: string
          direction: 'inbound' | 'outbound'
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          capcom6_message_id: string | null
          ai_generated: boolean
          requires_acknowledgment: boolean
          acknowledgment_code: string | null
          acknowledged_at: string | null
          acknowledgment_message_id: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          content: string
          direction: 'inbound' | 'outbound'
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          capcom6_message_id?: string | null
          ai_generated?: boolean
          requires_acknowledgment?: boolean
          acknowledgment_code?: string | null
          acknowledged_at?: string | null
          acknowledgment_message_id?: string | null
          metadata?: any | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          content?: string
          direction?: 'inbound' | 'outbound'
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
          capcom6_message_id?: string | null
          ai_generated?: boolean
          requires_acknowledgment?: boolean
          acknowledgment_code?: string | null
          acknowledged_at?: string | null
          acknowledgment_message_id?: string | null
          metadata?: any | null
        }
      }
      stores: {
        Row: {
          id: string
          store_number: number
          address: string
          city: string
          state: string
          zip_code: string
          phone: string
          pharmacy_hours: string | null
          store_hours: string | null
          latitude: number | null
          longitude: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_number: number
          address: string
          city: string
          state: string
          zip_code: string
          phone: string
          pharmacy_hours?: string | null
          store_hours?: string | null
          latitude?: number | null
          longitude?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_number?: number
          address?: string
          city?: string
          state?: string
          zip_code?: string
          phone?: string
          pharmacy_hours?: string | null
          store_hours?: string | null
          latitude?: number | null
          longitude?: number | null
          is_active?: boolean
          updated_at?: string
        }
      }
      store_schedules: {
        Row: {
          id: string
          store_id: string
          store_number: number
          date: string
          employee_name: string
          employee_id: string | null
          role: string | null
          employee_type: string | null
          shift_time: string
          scheduled_hours: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          store_number: number
          date: string
          employee_name?: string
          employee_id?: string | null
          role?: string | null
          employee_type?: string | null
          shift_time?: string
          scheduled_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          store_number?: number
          date?: string
          employee_name?: string
          employee_id?: string | null
          role?: string | null
          employee_type?: string | null
          shift_time?: string
          scheduled_hours?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          contact_id: string
          title: string
          description: string | null
          appointment_date: string
          appointment_time: string
          duration_minutes: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          location: string | null
          notes: string | null
          reminder_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          title: string
          description?: string | null
          appointment_date: string
          appointment_time: string
          duration_minutes?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          location?: string | null
          notes?: string | null
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          title?: string
          description?: string | null
          appointment_date?: string
          appointment_time?: string
          duration_minutes?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          location?: string | null
          notes?: string | null
          reminder_sent?: boolean
          updated_at?: string
        }
      }
    }
  }
}