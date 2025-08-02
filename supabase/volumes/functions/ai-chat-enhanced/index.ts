import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string
  user_id?: string
  context?: {
    previous_messages?: Array<{role: string, content: string}>
    user_type?: 'management' | 'employee'
  }
}

interface DataSource {
  name: string
  description: string
  endpoint: string
  method: string
  parameters?: Record<string, any>
  example_queries: string[]
}

interface QueryStrategy {
  name: string
  description: string
  use_cases: string[]
  implementation: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, user_id, context }: ChatRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Define all available data sources and endpoints
    const availableDataSources: DataSource[] = [
      {
        name: "stores",
        description: "Pharmacy store locations and information",
        endpoint: "/rest/v1/stores",
        method: "GET",
        example_queries: [
          "Show me all pharmacy locations",
          "What stores are in Springfield?",
          "Get store details for store number 1001"
        ]
      },
      {
        name: "contacts",
        description: "Employee contact information and profiles",
        endpoint: "/rest/v1/contacts",
        method: "GET",
        example_queries: [
          "List all employees",
          "Show high priority contacts",
          "Find employee by phone number"
        ]
      },
      {
        name: "store_schedules",
        description: "Employee work schedules and shift assignments",
        endpoint: "/rest/v1/store_schedules",
        method: "GET",
        example_queries: [
          "Who is working on July 15th?",
          "Show schedules for store 1001",
          "Find employees working night shifts"
        ]
      },
      {
        name: "messages",
        description: "SMS conversation history and communication logs",
        endpoint: "/rest/v1/messages",
        method: "GET",
        example_queries: [
          "Show recent messages from John Smith",
          "Get all outbound messages",
          "Find messages from yesterday"
        ]
      },
      {
        name: "appointments",
        description: "Scheduled appointments and meetings",
        endpoint: "/rest/v1/appointments",
        method: "GET",
        example_queries: [
          "Show appointments for today",
          "Find pending appointments",
          "Get appointments for Sarah Wilson"
        ]
      }
    ]

    // Define available query strategies
    const queryStrategies: QueryStrategy[] = [
      {
        name: "REST API Query",
        description: "Use PostgREST REST API endpoints for simple queries",
        use_cases: [
          "Simple data retrieval",
          "Filtering by specific criteria",
          "Pagination and sorting"
        ],
        implementation: "Make HTTP requests to /rest/v1/{table} with query parameters"
      },
      {
        name: "Direct SQL Query",
        description: "Execute custom SQL queries for complex analysis",
        use_cases: [
          "Complex joins and aggregations",
          "Statistical analysis",
          "Custom business logic"
        ],
        implementation: "Use exec_sql() function to run custom SQL"
      },
      {
        name: "SMS Integration",
        description: "Access SMS functionality and message history",
        use_cases: [
          "Send messages to employees",
          "Check message status",
          "Analyze communication patterns"
        ],
        implementation: "Use /functions/v1/send-sms-v3 endpoint"
      },
      {
        name: "n8n Workflow",
        description: "Trigger automated workflows for complex operations",
        use_cases: [
          "Bulk operations",
          "Scheduled tasks",
          "Integration with external systems"
        ],
        implementation: "Make requests to n8n webhook endpoints"
      }
    ]

    // Create comprehensive system prompt for the AI
    const systemPrompt = `You are an intelligent AI assistant for a pharmacy scheduling system. You have access to multiple data sources and query strategies.

AVAILABLE DATA SOURCES:
${availableDataSources.map(ds => `
- ${ds.name}: ${ds.description}
  Endpoint: ${ds.endpoint}
  Example queries: ${ds.example_queries.join(', ')}
`).join('')}

AVAILABLE QUERY STRATEGIES:
${queryStrategies.map(qs => `
- ${qs.name}: ${qs.description}
  Use cases: ${qs.use_cases.join(', ')}
  Implementation: ${qs.implementation}
`).join('')}

DATABASE SCHEMA:
- stores: id, store_number, address, city, state, zip_code, phone, pharmacy_hours, store_hours, latitude, longitude, is_active, created_at, updated_at
- contacts: id, name, phone, email, status, priority, notes, total_messages, total_appointments, ai_enabled, created_at, updated_at
- store_schedules: id, store_id, store_number, date, employee_name, employee_id, role, employee_type, shift_time, scheduled_hours, notes, created_at, updated_at
- messages: id, contact_id, content, direction, status, capcom6_message_id, ai_generated, requires_acknowledgment, acknowledgment_code, acknowledged_at, acknowledgment_message_id, metadata, created_at
- appointments: id, contact_id, title, description, appointment_date, appointment_time, duration_minutes, status, location, notes, reminder_sent, created_at, updated_at

AVAILABLE ENDPOINTS:
- REST API: http://localhost:8002/rest/v1/{table}
- SMS Send: http://localhost:8002/functions/v1/send-sms-v3
- n8n Webhook: http://localhost:5678/webhook/{workflow_id}

INSTRUCTIONS:
1. Analyze the user's question to determine the best query strategy
2. Choose the most appropriate data source(s)
3. Construct the appropriate query or API call
4. Execute the query and format the response
5. Provide insights and recommendations based on the data

For complex queries, you can:
- Use direct SQL with the exec_sql() function
- Combine multiple REST API calls
- Trigger n8n workflows for automation
- Send SMS messages when appropriate

Always provide context and insights with your responses.`

    // Generate AI response using OpenRouter
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Pharmacy Scheduling AI'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.statusText}`)
    }

    const openRouterData = await openRouterResponse.json()
    const aiResponse = openRouterData.choices[0].message.content

    // Execute any data queries mentioned in the AI response
    let dataResults = null
    if (aiResponse.includes('QUERY:')) {
      try {
        // Extract SQL query from AI response
        const queryMatch = aiResponse.match(/QUERY:\s*(SELECT.*?);/is)
        if (queryMatch) {
          const sqlQuery = queryMatch[1]
          const { data, error } = await supabase.rpc('exec_sql', { query: sqlQuery })
          if (error) throw error
          dataResults = data
        }
      } catch (error) {
        console.error('Query execution error:', error)
      }
    }

    // Store the conversation in the database
    if (user_id) {
      await supabase.from('messages').insert({
        contact_id: user_id,
        content: message,
        direction: 'inbound',
        status: 'delivered',
        ai_generated: false
      })

      await supabase.from('messages').insert({
        contact_id: user_id,
        content: aiResponse,
        direction: 'outbound',
        status: 'sent',
        ai_generated: true
      })
    }

    return new Response(
      JSON.stringify({
        ai_response: aiResponse,
        data_results: dataResults,
        available_sources: availableDataSources.length,
        query_strategies: queryStrategies.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 