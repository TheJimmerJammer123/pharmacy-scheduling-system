import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CapcomWebhookPayload {
  event: string;
  payload: {
    message: string;
    phoneNumber: string;
    receivedAt: string;
  };
  [key: string]: any;
}

// Legacy format support (for backward compatibility)
interface LegacyCapcomWebhookPayload {
  id: string;
  message: string;
  phone: string;
  received_at: string;
  sim: number;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle GET requests (browser visits, health checks)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'Capcom6 webhook endpoint is operational',
        method: 'POST',
        expected_payload: {
          event: 'sms:received',
          payload: {
            message: 'string',
            phoneNumber: 'string',
            receivedAt: 'string'
          }
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // For now, use direct database connection to bypass JWT issues
    console.log('Creating Supabase client...')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'http://kong:8000',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'))
    console.log('Service role key length:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length)

    // Parse the webhook payload from Capcom6 with error handling
    let rawPayload: any;
    try {
      const body = await req.text()
      if (!body.trim()) {
        return new Response(
          JSON.stringify({ error: 'Empty request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      rawPayload = JSON.parse(body)
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Received Capcom6 webhook:', rawPayload)

    // Handle both new and legacy payload formats
    let message: string;
    let phoneNumber: string;
    let receivedAt: string;
    let messageId: string | null = null;

    if (rawPayload.event === 'sms:received' && rawPayload.payload) {
      // New format
      message = rawPayload.payload.message;
      phoneNumber = rawPayload.payload.phoneNumber;
      receivedAt = rawPayload.payload.receivedAt;
    } else if (rawPayload.message && rawPayload.phone) {
      // Legacy format
      message = rawPayload.message;
      phoneNumber = rawPayload.phone;
      receivedAt = rawPayload.received_at || new Date().toISOString();
      messageId = rawPayload.id;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid payload format. Expected either new format with event/payload or legacy format with message/phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone number (remove any formatting)
    const normalizedPhone = phoneNumber.replace(/\D/g, '')
    const formattedPhone = normalizedPhone.startsWith('1') ? `+${normalizedPhone}` : `+1${normalizedPhone}`

    // Find or create contact
    let { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('id, name, ai_enabled')
      .eq('phone', formattedPhone)
      .single()

    if (contactError && contactError.code === 'PGRST116') {
      // Contact doesn't exist, create one
      const { data: newContact, error: createError } = await supabaseClient
        .from('contacts')
        .insert({
          name: `Unknown ${formattedPhone}`,
          phone: formattedPhone,
          status: 'active'
        })
        .select('id, name, ai_enabled')
        .single()

      if (createError) {
        console.error('Error creating contact:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create contact' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      contact = newContact
    } else if (contactError) {
      console.error('Error finding contact:', contactError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save the incoming message
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        contact_id: contact.id,
        content: message,
        direction: 'inbound',
        status: 'delivered',
        capcom6_message_id: messageId,
        metadata: {
          received_at: receivedAt,
          raw_payload: rawPayload
        }
      })

    if (messageError) {
      console.error('Error saving message:', messageError)
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: If AI is enabled for this contact, generate and send AI response
    if (contact.ai_enabled) {
      console.log(`AI enabled for contact ${contact.name}, will implement AI response later`)
      // This is where we would integrate with OpenAI or another AI service
      // to generate a response based on the message content and scheduling context
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        contact_id: contact.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})