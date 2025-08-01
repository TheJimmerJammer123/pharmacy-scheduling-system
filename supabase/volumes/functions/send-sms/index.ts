import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendSMSRequest {
  contact_id: string;
  message: string;
  ai_generated?: boolean;
  requires_acknowledgment?: boolean;
}

interface CapcomSendRequest {
  message: string;
  phone: string;
  sim?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse the request
    const { contact_id, message, ai_generated = false, requires_acknowledgment = false }: SendSMSRequest = await req.json()

    if (!contact_id || !message) {
      return new Response(
        JSON.stringify({ error: 'contact_id and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get contact information
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('id, name, phone')
      .eq('id', contact_id)
      .single()

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create message record in database (pending status)
    const { data: messageRecord, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        contact_id: contact_id,
        content: message,
        direction: 'outbound',
        status: 'pending',
        ai_generated: ai_generated,
        requires_acknowledgment: requires_acknowledgment
      })
      .select('id')
      .single()

    if (messageError || !messageRecord) {
      console.error('Error creating message record:', messageError)
      return new Response(
        JSON.stringify({ error: 'Failed to create message record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare Capcom6 API request
    const capcomPayload: CapcomSendRequest = {
      message: message,
      phone: contact.phone.replace(/\D/g, ''), // Remove formatting for Capcom6
      sim: 1 // Default to SIM 1, could be configurable
    }

    // Get Capcom6 credentials from environment
    const capcom6Url = Deno.env.get('CAPCOM6_URL') || 'http://100.126.232.47:8080'
    const capcom6Username = Deno.env.get('CAPCOM6_USERNAME') || 'sms'
    const capcom6Password = Deno.env.get('CAPCOM6_PASSWORD') || 'ciSEJNmY'

    // Send SMS via Capcom6
    const capcomResponse = await fetch(`${capcom6Url}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${capcom6Username}:${capcom6Password}`)}`
      },
      body: JSON.stringify(capcomPayload)
    })

    const capcomResult = await capcomResponse.json()

    // Update message status based on Capcom6 response
    let status = 'failed'
    let capcom6_message_id = null
    let metadata = { capcom_response: capcomResult }

    if (capcomResponse.ok && capcomResult.success) {
      status = 'sent'
      capcom6_message_id = capcomResult.id || capcomResult.message_id
    }

    // Update message record with results
    const { error: updateError } = await supabaseClient
      .from('messages')
      .update({
        status: status,
        capcom6_message_id: capcom6_message_id,
        metadata: metadata
      })
      .eq('id', messageRecord.id)

    if (updateError) {
      console.error('Error updating message status:', updateError)
    }

    if (!capcomResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS', 
          details: capcomResult,
          message_id: messageRecord.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messageRecord.id,
        capcom6_message_id: capcom6_message_id,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Send SMS error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})