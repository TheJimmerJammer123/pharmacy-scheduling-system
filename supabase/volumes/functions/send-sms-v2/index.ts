import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendSMSRequest {
  contactId: string;
  message: string;
  requiresAcknowledgment?: boolean;
}

interface CapcomSendRequest {
  message: string;
  phoneNumbers: string[];
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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contactId, message, requiresAcknowledgment = false }: SendSMSRequest = requestBody;

    if (!contactId || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'contactId and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get contact information
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('id, name, phone')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contact not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create message record in database (pending status)
    const { data: messageRecord, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        contact_id: contactId,
        content: message,
        direction: 'outbound',
        status: 'pending',
        ai_generated: false,
        requires_acknowledgment: requiresAcknowledgment
      })
      .select('id')
      .single()

    if (messageError || !messageRecord) {
      console.error('Error creating message record:', messageError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create message record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare Capcom6 API request using correct format
    const capcomPayload = {
      message: message,
      phoneNumbers: [contact.phone], // Use phoneNumbers array with original format
      sim: 1 // Default to SIM 1
    }

    // Get Capcom6 credentials from environment
    const capcom6Url = Deno.env.get('CAPCOM6_URL') || 'http://100.126.232.47:8080'
    const capcom6Username = Deno.env.get('CAPCOM6_USERNAME') || 'sms'
    const capcom6Password = Deno.env.get('CAPCOM6_PASSWORD') || 'ciSEJNmY'

    let status = 'failed'
    let capcom6_message_id = null
    let metadata = { capcom_response: null, error: null }

    try {
      // Send SMS via Capcom6 using correct API
      const capcomResponse = await fetch(`${capcom6Url}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${capcom6Username}:${capcom6Password}`)}`
        },
        body: JSON.stringify(capcomPayload)
      })

      const capcomResult = await capcomResponse.json()
      metadata.capcom_response = capcomResult

      if (capcomResponse.ok && capcomResult.id) {
        status = 'sent'
        capcom6_message_id = capcomResult.id
        
        // Check for specific recipient status
        if (capcomResult.recipients && capcomResult.recipients[0]) {
          const recipientState = capcomResult.recipients[0].state
          if (recipientState === 'Failed') {
            status = 'failed'
            metadata.error = capcomResult.recipients[0].error || 'Recipient failed'
          }
        }
      } else {
        console.warn('Capcom6 SMS failed:', capcomResult)
        metadata.error = capcomResult.message || capcomResult.error || 'Capcom6 service error'
      }
    } catch (capcomError) {
      console.warn('Capcom6 network error:', capcomError)
      metadata.error = 'Capcom6 service unavailable'
      // Don't fail the entire request - message is still recorded
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

    // Return success even if Capcom6 failed - message is recorded
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageRecord.id,
        capcom6MessageId: capcom6_message_id,
        status: status,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone
        },
        capcom6Status: status === 'sent' ? 'delivered' : 'gateway_error'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Send SMS error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})