import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the webhook payload
    const rawPayload = await req.json()
    console.log('Received webhook payload:', rawPayload)
    
    // Extract message data
    let message: string;
    let phoneNumber: string;
    let receivedAt: string;
    
    if (rawPayload.event === 'sms:received' && rawPayload.payload) {
      message = rawPayload.payload.message;
      phoneNumber = rawPayload.payload.phoneNumber;
      receivedAt = rawPayload.payload.receivedAt;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid payload format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Test database connection directly using PostgreSQL client
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') || 'postgresql://postgres:your-super-secret-and-long-postgres-password@db:5432/postgres'
    
    console.log('Database URL configured:', !!dbUrl)
    console.log('Message data extracted:', { message, phoneNumber, receivedAt })
    
    // For now, just log and return success to test the webhook processing
    const result = {
      success: true,
      message: 'Webhook processed successfully',
      data: {
        message,
        phoneNumber,
        receivedAt,
        timestamp: new Date().toISOString()
      },
      database_config: {
        url_configured: !!dbUrl,
        supabase_url: Deno.env.get('SUPABASE_URL'),
        service_key_length: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length || 0
      }
    }
    
    return new Response(
      JSON.stringify(result, null, 2),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Simple webhook test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Webhook test failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})