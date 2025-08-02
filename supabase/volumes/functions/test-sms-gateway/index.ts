import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Get Capcom6 configuration from environment
    const capcom6Url = Deno.env.get('CAPCOM6_URL') || 'http://100.126.232.47:8080'
    const capcom6Username = Deno.env.get('CAPCOM6_USERNAME') || 'sms'
    const capcom6Password = Deno.env.get('CAPCOM6_PASSWORD') || 'ciSEJNmY'
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      gateway_config: {
        url: capcom6Url,
        username: capcom6Username,
        password_set: !!capcom6Password
      },
      tests: []
    }

    // Test 1: Basic connectivity (ping equivalent)
    try {
      console.log('Testing basic connectivity to Capcom6 gateway...')
      const basicResponse = await fetch(`${capcom6Url}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${capcom6Username}:${capcom6Password}`)}`
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      diagnostics.tests.push({
        test: 'basic_connectivity',
        status: basicResponse.ok ? 'success' : 'failed',
        status_code: basicResponse.status,
        response_ok: basicResponse.ok,
        response_size: basicResponse.headers.get('content-length') || 'unknown'
      })
      
      // Test 2: API endpoint validation
      if (basicResponse.ok) {
        console.log('Testing API endpoints...')
        try {
          const responseText = await basicResponse.text()
          diagnostics.tests.push({
            test: 'api_response',
            status: 'success',
            response_preview: responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
          })
        } catch (err) {
          diagnostics.tests.push({
            test: 'api_response',
            status: 'failed',
            error: err.message
          })
        }
      }
      
      // Test 3: Send test SMS (only if basic connectivity works)
      if (basicResponse.ok && req.method === 'POST') {
        console.log('Testing SMS sending...')
        const { phoneNumber, message } = await req.json()
        
        if (phoneNumber && message) {
          const smsPayload = {
            message: message,
            phoneNumbers: [phoneNumber],
            sim: 1
          }
          
          const smsResponse = await fetch(`${capcom6Url}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(`${capcom6Username}:${capcom6Password}`)}`
            },
            body: JSON.stringify(smsPayload),
            signal: AbortSignal.timeout(15000) // 15 second timeout
          })
          
          const smsResult = await smsResponse.text()
          
          diagnostics.tests.push({
            test: 'sms_sending',
            status: smsResponse.ok ? 'success' : 'failed',
            status_code: smsResponse.status,
            payload: smsPayload,
            response: smsResult.length > 300 ? smsResult.substring(0, 300) + '...' : smsResult
          })
        }
      }
      
    } catch (error) {
      console.error('Capcom6 connectivity test failed:', error)
      diagnostics.tests.push({
        test: 'basic_connectivity',
        status: 'failed',
        error: error.message,
        error_type: error.name
      })
    }

    // Test 4: Webhook registration check
    try {
      console.log('Testing webhook registration...')
      const webhookResponse = await fetch(`${capcom6Url}/webhooks`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${capcom6Username}:${capcom6Password}`)}`
        },
        signal: AbortSignal.timeout(10000)
      })
      
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.text()
        diagnostics.tests.push({
          test: 'webhook_check',
          status: 'success',
          webhooks: webhookData.length > 500 ? webhookData.substring(0, 500) + '...' : webhookData
        })
      } else {
        diagnostics.tests.push({
          test: 'webhook_check',
          status: 'failed',
          status_code: webhookResponse.status
        })
      }
    } catch (error) {
      diagnostics.tests.push({
        test: 'webhook_check',
        status: 'failed',
        error: error.message
      })
    }

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('SMS Gateway Test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'SMS gateway test failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})