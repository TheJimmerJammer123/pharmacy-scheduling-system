import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request with error handling
    let requestData;
    try {
      const body = await req.text()
      requestData = JSON.parse(body)
    } catch (parseError) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid JSON: ${parseError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { contactId, message, requiresAcknowledgment = false } = requestData

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
      console.error('Contact lookup error:', contactError)
      console.log('Contact ID searched:', contactId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Contact not found', 
          details: contactError ? contactError.message : 'No contact returned',
          contactId: contactId
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create message record in database
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
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create message record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send SMS via Capcom6 using correct API format
    const capcom6Url = 'http://100.126.232.47:8080'
    const capcom6Username = 'sms'
    const capcom6Password = 'ciSEJNmY'

    let status = 'failed'
    let capcom6_message_id = null
    let metadata = { capcom_response: null, error: null }

    try {
      const capcomPayload = {
        message: message,
        phoneNumbers: [contact.phone], // Use phoneNumbers array
        sim: 1
      }


      const capcomResponse = await fetch(`${capcom6Url}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${capcom6Username}:${capcom6Password}`)}`
        },
        body: JSON.stringify(capcomPayload)
      })

      let capcomResult
      try {
        const responseText = await capcomResponse.text()
        capcomResult = responseText ? JSON.parse(responseText) : {}
      } catch (jsonError) {
        capcomResult = { error: 'Invalid JSON response' }
      }
      metadata.capcom_response = capcomResult

      if (capcomResponse.ok && capcomResult.id) {
        status = 'sent'
        capcom6_message_id = capcomResult.id
        
        // Check recipient status
        if (capcomResult.recipients && capcomResult.recipients[0]) {
          const recipientState = capcomResult.recipients[0].state
          if (recipientState === 'Failed') {
            status = 'failed'
            metadata.error = capcomResult.recipients[0].error || 'Recipient failed'
          }
        }
      } else {
        metadata.error = 'Capcom6 API error'
      }
    } catch (capcomError) {
      metadata.error = `Capcom6 service unavailable: ${capcomError.message}`
    }

    // Update message record
    await supabaseClient
      .from('messages')
      .update({
        status: status,
        capcom6_message_id: capcom6_message_id,
        metadata: metadata
      })
      .eq('id', messageRecord.id)

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
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})