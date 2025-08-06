import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ChatRequest {
  message: string
  user_id?: string
  conversation_id?: string
  context?: {
    previous_messages?: Array<{role: string, content: string}>
    user_type?: 'management' | 'employee'
    current_time?: string
    user_permissions?: string[]
  }
  stream?: boolean
  model_preference?: 'auto' | 'gpt-4' | 'claude-3.5-sonnet' | 'qwen3-coder' | 'gpt-3.5-turbo'
}

interface AIModel {
  name: string
  endpoint: string
  model_id: string
  max_tokens: number
  strengths: string[]
  cost_tier: 'low' | 'medium' | 'high'
}

interface QueryCapability {
  name: string
  description: string
  sql_templates: string[]
  complexity: 'simple' | 'medium' | 'complex'
  requires_permission: string[]
}

interface ActionCapability {
  name: string
  description: string
  endpoint: string
  method: string
  parameters: Record<string, any>
  requires_permission: string[]
}

interface ChatResponse {
  response: string
  model_used: string
  data_results?: any[]
  suggested_actions?: Array<{
    label: string
    action: string
    parameters?: Record<string, any>
  }>
  conversation_id: string
  query_executed?: string
  performance_metrics: {
    response_time_ms: number
    model_selection_reason: string
    data_queries_executed: number
    tokens_used: number
  }
}

// Helper function to format analytical responses
function formatAnalyticalResponse(data: any[], responseFormat: string, originalQuestion: string): string {
  switch (responseFormat) {
    case 'most_employees_monday':
      if (data.length > 0) {
        const topStore = data[0]
        let response = `📊 **Monday Staffing Analysis for July 2025**\n\n`
        response += `🏆 **Top Store**: #${topStore.store_number} with ${topStore.employee_count} employees on Mondays\n`
        response += `⏰ **Average Hours**: ${parseFloat(topStore.avg_hours).toFixed(1)} hours per employee\n\n`
        
        response += `📈 **Top 5 Stores by Monday Staffing:**\n`
        data.slice(0, 5).forEach((store, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍'
          response += `${medal} Store #${store.store_number}: ${store.employee_count} employees (${parseFloat(store.avg_hours).toFixed(1)}h avg)\n`
        })
        
        return response
      }
      break
      
    case 'peak_hours':
      if (data.length > 0) {
        let response = `⏰ **Peak Staffing Hours Analysis**\n\n`
        response += `🔥 **Busiest Hour**: ${data[0].hour_start}:00 with ${data[0].total_shifts} total shifts\n`
        response += `🏪 **Stores Active**: ${data[0].stores_count} stores during peak hour\n`
        response += `📏 **Average Shift Length**: ${parseFloat(data[0].avg_shift_length).toFixed(1)} hours\n\n`
        
        response += `📊 **Top 5 Busiest Hours:**\n`
        data.slice(0, 5).forEach((hour, idx) => {
          const icon = idx === 0 ? '🔥' : idx === 1 ? '⚡' : '⏰'
          const hourFormatted = hour.hour_start < 12 ? `${hour.hour_start}:00 AM` : hour.hour_start === 12 ? '12:00 PM' : `${hour.hour_start - 12}:00 PM`
          response += `${icon} ${hourFormatted}: ${hour.total_shifts} shifts across ${hour.stores_count} stores\n`
        })
        
        return response
      }
      break
      
    case 'totals':
      if (data.length > 0) {
        const totals = data[0]
        let response = `📊 **July 2025 Staffing Summary**\n\n`
        response += `👥 **Unique Employees**: ${totals.unique_employees}\n`
        response += `📋 **Total Shifts**: ${totals.total_shifts}\n`
        response += `⏱️ **Total Hours**: ${parseFloat(totals.total_hours).toFixed(1)}\n`
        response += `📈 **Average Hours per Employee**: ${(parseFloat(totals.total_hours) / parseInt(totals.unique_employees)).toFixed(1)}\n`
        
        return response
      }
      break
  }
  
  return '📊 **Analysis Results**\\n\\nI found data but could not format it properly. Here is the raw data:\\n' + JSON.stringify(data.slice(0, 3), null, 2)
}

// Helper function to format specific schedule responses
function formatSpecificScheduleResponse(data: any[], storeNumber: number, queryDate: string): string {
  const dateFormatted = new Date(queryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  
  // Group employees by role for better organization
  const employeesByRole = data.reduce((acc, row) => {
    if (!acc[row.role]) acc[row.role] = []
    acc[row.role].push(row)
    return acc
  }, {})
  
  let formattedResponse = `📅 **Schedule for Store #${storeNumber} on ${dateFormatted}**\n\n`
  
  // Sort roles: Pharmacist, Technician, Clerk
  const roleOrder = ['Pharmacist', 'Technician', 'Clerk']
  const sortedRoles = Object.keys(employeesByRole).sort((a, b) => {
    const aIndex = roleOrder.indexOf(a)
    const bIndex = roleOrder.indexOf(b)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })
  
  sortedRoles.forEach(role => {
    const roleIcon = role === 'Pharmacist' ? '💊' : role === 'Technician' ? '🔬' : '👤'
    formattedResponse += `${roleIcon} **${role}${employeesByRole[role].length > 1 ? 's' : ''}:**\n`
    
    employeesByRole[role].forEach(emp => {
      formattedResponse += `• ${emp.employee_name} - ${emp.shift_time}\n`
    })
    formattedResponse += '\n'
  })
  
  // Add summary
  const totalEmployees = data.length
  const totalHours = data.reduce((sum, emp) => sum + (emp.scheduled_hours || 0), 0)
  formattedResponse += `📊 **Summary:** ${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''} scheduled (${totalHours} total hours)`
  
  return formattedResponse
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const { 
      message, 
      user_id, 
      conversation_id, 
      context = {}, 
      stream = false,
      model_preference = 'auto'
    }: ChatRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Define available AI models with intelligent selection
    const availableModels: AIModel[] = [
      {
        name: 'gpt-4-turbo',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model_id: 'openai/gpt-4-turbo-preview',
        max_tokens: 4000,
        strengths: ['complex reasoning', 'multi-step analysis', 'business logic'],
        cost_tier: 'high'
      },
      {
        name: 'claude-3.5-sonnet',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions', 
        model_id: 'anthropic/claude-3.5-sonnet',
        max_tokens: 3000,
        strengths: ['analytical thinking', 'data analysis', 'structured responses'],
        cost_tier: 'high'
      },
      {
        name: 'qwen3-coder',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model_id: 'qwen/qwen-2.5-coder-32b-instruct',
        max_tokens: 2000,
        strengths: ['sql generation', 'technical queries', 'code analysis'],
        cost_tier: 'low'
      },
      {
        name: 'gpt-3.5-turbo',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model_id: 'openai/gpt-3.5-turbo',
        max_tokens: 1500,
        strengths: ['quick responses', 'simple queries', 'general chat'],
        cost_tier: 'low'
      }
    ]

    // Define advanced query capabilities
    const queryCapabilities: QueryCapability[] = [
      {
        name: 'schedule_analysis',
        description: 'Analyze employee schedules, shifts, and coverage',
        sql_templates: [
          'SELECT * FROM store_schedules WHERE date BETWEEN $1 AND $2',
          'SELECT employee_name, COUNT(*) as shifts FROM store_schedules WHERE date >= CURRENT_DATE GROUP BY employee_name',
          'SELECT s.*, c.name, c.phone FROM store_schedules s JOIN contacts c ON s.employee_name = c.name'
        ],
        complexity: 'medium',
        requires_permission: ['read_schedules']
      },
      {
        name: 'employee_management',
        description: 'Manage employee information, contacts, and performance',
        sql_templates: [
          'SELECT * FROM contacts WHERE status = $1 ORDER BY priority DESC',
          'SELECT c.*, COUNT(m.id) as message_count FROM contacts c LEFT JOIN messages m ON c.id = m.contact_id GROUP BY c.id',
          'SELECT * FROM contacts WHERE name ILIKE $1 OR phone ILIKE $1'
        ],
        complexity: 'simple',
        requires_permission: ['read_employees']
      },
      {
        name: 'communication_analysis',
        description: 'Analyze SMS communications and message patterns',
        sql_templates: [
          'SELECT * FROM messages WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 50',
          'SELECT direction, COUNT(*) FROM messages WHERE contact_id = $1 GROUP BY direction',
          'SELECT DATE(created_at) as date, COUNT(*) as messages FROM messages GROUP BY DATE(created_at) ORDER BY date DESC'
        ],
        complexity: 'medium',
        requires_permission: ['read_messages']
      },
      {
        name: 'store_operations',
        description: 'Store information, locations, and operational data',
        sql_templates: [
          'SELECT * FROM stores WHERE is_active = true ORDER BY store_number',
          'SELECT s.*, COUNT(ss.id) as scheduled_shifts FROM stores s LEFT JOIN store_schedules ss ON s.store_number = ss.store_number GROUP BY s.id',
          'SELECT * FROM stores WHERE city ILIKE $1 OR address ILIKE $1'
        ],
        complexity: 'simple',
        requires_permission: ['read_stores']
      }
    ]

    // Define action capabilities
    const actionCapabilities: ActionCapability[] = [
      {
        name: 'send_sms',
        description: 'Send SMS message to employee',
        endpoint: '/functions/v1/send-sms-v3',
        method: 'POST',
        parameters: { phone: 'string', message: 'string' },
        requires_permission: ['send_sms']
      },
      {
        name: 'trigger_workflow',
        description: 'Trigger n8n automation workflow',
        endpoint: '/webhook/trigger-workflow',
        method: 'POST',
        parameters: { workflow_id: 'string', data: 'object' },
        requires_permission: ['trigger_workflows']
      },
      {
        name: 'schedule_update',
        description: 'Update employee schedule',
        endpoint: '/rest/v1/store_schedules',
        method: 'PATCH',
        parameters: { id: 'string', updates: 'object' },
        requires_permission: ['modify_schedules']
      }
    ]

    // Intelligent model selection based on query complexity and content
    function selectOptimalModel(message: string, context: any, preference: string): AIModel {
      if (preference !== 'auto') {
        const preferredModel = availableModels.find(m => m.name === preference)
        if (preferredModel) return preferredModel
      }

      const messageLength = message.length
      const hasCodeKeywords = /sql|query|database|select|join|where/i.test(message)
      const hasComplexKeywords = /analyze|predict|optimize|recommend|complex|statistical/i.test(message)
      const hasSimpleKeywords = /hello|hi|help|what|how|simple|quick/i.test(message)

      // Complex analytical queries - use Claude 3.5 Sonnet
      if (hasComplexKeywords || messageLength > 200) {
        return availableModels.find(m => m.name === 'claude-3.5-sonnet')!
      }

      // SQL/Technical queries - use Qwen3 Coder
      if (hasCodeKeywords) {
        return availableModels.find(m => m.name === 'qwen3-coder')!
      }

      // Simple queries - use GPT-3.5-turbo
      if (hasSimpleKeywords || messageLength < 50) {
        return availableModels.find(m => m.name === 'gpt-3.5-turbo')!
      }

      // Default to GPT-4 for balanced performance
      return availableModels.find(m => m.name === 'gpt-4-turbo')!
    }

    // Generate comprehensive system prompt
    function generateSystemPrompt(userType: string = 'management'): string {
      const currentTime = new Date().toISOString()
      const permissions = userType === 'management' 
        ? ['read_schedules', 'read_employees', 'read_messages', 'read_stores', 'send_sms', 'modify_schedules', 'trigger_workflows']
        : ['read_schedules', 'read_employees']

      return `You are an advanced AI assistant for a pharmacy scheduling system. Current time: ${currentTime}

SYSTEM CAPABILITIES:
- Multi-model AI selection for optimal responses
- Real-time database query execution
- SMS communication integration
- Workflow automation via n8n
- Predictive analytics and insights
- Context-aware conversation memory

USER CONTEXT:
- User Type: ${userType}
- Permissions: ${permissions.join(', ')}
- Available Actions: ${actionCapabilities.filter(a => a.requires_permission.some(p => permissions.includes(p))).map(a => a.name).join(', ')}

DATABASE SCHEMA:
- stores: id, store_number, address, city, state, zip_code, phone, pharmacy_hours, store_hours, latitude, longitude, is_active, created_at, updated_at
- contacts: id, name, phone, email, status, priority, notes, total_messages, total_appointments, ai_enabled, created_at, updated_at
- store_schedules: id, store_id, store_number, date, employee_name, employee_id, role, employee_type, shift_time, scheduled_hours, notes, created_at, updated_at
- messages: id, contact_id, content, direction, status, capcom6_message_id, ai_generated, requires_acknowledgment, acknowledgment_code, acknowledged_at, acknowledgment_message_id, metadata, created_at

RESPONSE GUIDELINES:
1. Be concise and direct - provide answers without lengthy explanations
2. Use actual data from queries, never placeholder text like "[Employee Name]"
3. If no data is found, say so clearly
4. Only provide essential information requested
5. Don't explain how you arrived at the answer unless specifically asked

QUERY EXECUTION:
- Execute SQL queries to get real data
- Use actual query results in your response
- If query returns empty results, state "No data found"
- Present data clearly and concisely

CRITICAL: You are an advanced AI system for pharmacy scheduling with dynamic SQL generation capabilities.

When users ask questions about scheduling data:
1. The system will automatically detect if a database query is needed
2. If needed, you will generate appropriate SQL queries to get real data
3. You will then provide formatted, insightful responses using that data

Database schema available:
- store_schedules: store_number, employee_name, role, shift_time, date, scheduled_hours
- Date range: July 2025
- Roles: Pharmacist, Technician, Clerk

For any question that can be answered with data:
- Be direct and factual
- Use real employee names and numbers
- Format responses clearly with structure and insights
- Never use placeholder text like '[Employee Name]'

If you cannot answer with available data, explain what information would be needed.
Always provide actionable insights when possible.`
    }

    // Select optimal model
    const selectedModel = selectOptimalModel(message, context, model_preference)
    console.log(`Selected model: ${selectedModel.name} for message: "${message.substring(0, 50)}..."`)

    // Generate conversation ID if not provided
    const conversationId = conversation_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Retrieve conversation history for context
    let conversationHistory: Array<{role: string, content: string}> = []
    if (user_id) {
      const { data: previousMessages } = await supabase
        .from('messages')
        .select('content, ai_generated, created_at')
        .eq('contact_id', user_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (previousMessages) {
        conversationHistory = previousMessages.reverse().map(msg => ({
          role: msg.ai_generated ? 'assistant' : 'user',
          content: msg.content
        }))
      }
    }

    // Build messages array for AI
    const messages = [
      {
        role: 'system',
        content: generateSystemPrompt(context.user_type || 'management')
      },
      ...conversationHistory.slice(-6), // Include last 6 messages for context
      {
        role: 'user', 
        content: message
      }
    ]

    // Make AI request
    const aiResponse = await fetch(selectedModel.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('API_EXTERNAL_URL') || 'http://100.120.219.68:8002',
        'X-Title': 'Pharmacy Scheduling AI Supercharged'
      },
      body: JSON.stringify({
        model: selectedModel.model_id,
        messages: messages,
        temperature: 0.7,
        max_tokens: selectedModel.max_tokens,
        stream: stream
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error(`AI model error: ${selectedModel.model_id} failed with ${aiResponse.status}: ${errorText}`)
      
      // Try to fallback to GPT-3.5-turbo if the selected model fails
      if (selectedModel.name !== 'gpt-3.5-turbo') {
        console.log('Attempting fallback to GPT-3.5-turbo...')
        const fallbackModel = availableModels.find(m => m.name === 'gpt-3.5-turbo')!
        
        const fallbackResponse = await fetch(fallbackModel.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': Deno.env.get('API_EXTERNAL_URL') || 'http://100.120.219.68:8002',
            'X-Title': 'Pharmacy Scheduling AI Supercharged'
          },
          body: JSON.stringify({
            model: fallbackModel.model_id,
            messages: messages,
            temperature: 0.7,
            max_tokens: fallbackModel.max_tokens
          })
        })
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const fallbackText = fallbackData.choices[0].message.content
          
          // Continue with fallback response
          const response: ChatResponse = {
            response: `⚠️ **Fallback Model Used**: The requested ${selectedModel.name} model was unavailable, so I used GPT-3.5-turbo instead.\n\n${fallbackText}`,
            model_used: `${selectedModel.name} → ${fallbackModel.name} (fallback)`,
            conversation_id: conversationId,
            performance_metrics: {
              response_time_ms: Date.now() - startTime,
              model_selection_reason: `Fallback from ${selectedModel.name} to ${fallbackModel.name}`,
              data_queries_executed: 0,
              tokens_used: fallbackModel.max_tokens
            }
          }
          
          return new Response(
            JSON.stringify(response),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }
      }
      
      throw new Error(`AI model error: ${selectedModel.model_id} - ${aiResponse.status} ${aiResponse.statusText}. Details: ${errorText}`)
    }

    const aiData = await aiResponse.json()
    const aiResponseText = aiData.choices[0].message.content

    // Execute any data queries mentioned in the AI response and get final response
    let dataResults: any[] = []
    let queryExecuted = ''
    let queriesExecuted = 0
    let finalResponse = aiResponseText

    // Check if this is likely a data query that needs database access
    const seemsLikeDataQuery = /scheduled?|employee|shift|store|hour|day|week|coverage|staffing|analysis|compare|average|most|total|how many|which|what|show|during/i.test(message)
    
    if (seemsLikeDataQuery) {
      console.log('Detected potential data query, asking AI to generate SQL...')
      
      // Ask the AI to generate an appropriate SQL query
      const sqlGenerationPrompt = `Based on this question about pharmacy scheduling data: "${message}"

Database schema:
- store_schedules: store_number, employee_name, role, shift_time, date, scheduled_hours
- Available date range: July 2025 (2025-07-01 to 2025-07-31)
- shift_time format: "9:00am - 5:00pm" (text format)
- roles: Pharmacist, Technician, Clerk

IMPORTANT SQL Rules:
1. For average staffing per store: Use subqueries like SELECT AVG(store_employee_count) FROM (SELECT store_number, COUNT(*) as store_employee_count FROM store_schedules GROUP BY store_number) sub
2. Cannot nest aggregates like AVG(COUNT(...))
3. For time analysis: Use CAST(SPLIT_PART(shift_time, ':', 1) AS INTEGER) to extract hours
4. For day analysis: Use EXTRACT(DOW FROM date) where 0=Sunday, 1=Monday, etc.
5. Always include appropriate WHERE clauses for date filtering

Example patterns:
- Average per store: SELECT AVG(cnt) FROM (SELECT COUNT(*) as cnt FROM table GROUP BY store_number) sub
- Peak hours: SELECT hour, COUNT(*) FROM (SELECT CAST(SPLIT_PART(shift_time, ':', 1) AS INTEGER) as hour FROM table) sub GROUP BY hour ORDER BY COUNT(*) DESC
- Day comparison: SELECT EXTRACT(DOW FROM date) as day, COUNT(*) FROM table GROUP BY day ORDER BY COUNT(*) DESC

Return ONLY the SQL query, no explanation. Use proper PostgreSQL syntax without semicolons.

If the question cannot be answered with the available data, respond with: NO_QUERY_POSSIBLE`

      try {
        const sqlResponse = await fetch(selectedModel.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': Deno.env.get('API_EXTERNAL_URL') || 'http://100.120.219.68:8002',
            'X-Title': 'Pharmacy Scheduling AI - SQL Generation'
          },
          body: JSON.stringify({
            model: selectedModel.model_id,
            messages: [{ role: 'user', content: sqlGenerationPrompt }],
            temperature: 0.1,
            max_tokens: 500
          })
        })
        
        if (sqlResponse.ok) {
          const sqlData = await sqlResponse.json()
          let generatedSQL = sqlData.choices[0].message.content.trim()
          
          console.log('AI generated SQL:', generatedSQL)
          
          if (generatedSQL === 'NO_QUERY_POSSIBLE') {
            console.log('AI determined query is not possible with available data')
            // Let it fall through to normal AI processing
          } else {
            // Clean up the SQL (remove markdown, semicolons, extra whitespace)
            generatedSQL = generatedSQL.replace(/```sql\n|```/g, '').replace(/;\s*$/g, '').trim()
            
            // Execute the AI-generated query
            try {
              console.log(`Executing AI-generated query: ${generatedSQL}`)
              
              const { data, error } = await supabase.rpc('exec_sql', { 
                query: generatedSQL 
              })
              
              if (error) {
                console.error('AI-generated query error:', error)
                // Fall back to AI processing instead of showing error
                console.log('Query failed, falling back to AI interpretation')
              } else {
                dataResults.push(data)
                queryExecuted = generatedSQL
                queriesExecuted++
                
                console.log('AI query results:', data)
                
                if (data && Array.isArray(data) && data.length > 0) {
                  // Ask AI to format the results in a user-friendly way
                  const formatPrompt = `The user asked: "${message}"

I executed this query: ${generatedSQL}

Results: ${JSON.stringify(data, null, 2)}

Provide a clear, well-formatted response that directly answers their question using this real data. Use emojis and structure for readability. Be concise and insightful.`
                  
                  const formatResponse = await fetch(selectedModel.endpoint, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
                      'Content-Type': 'application/json',
                      'HTTP-Referer': Deno.env.get('API_EXTERNAL_URL') || 'http://100.120.219.68:8002',
                      'X-Title': 'Pharmacy Scheduling AI - Response Formatting'
                    },
                    body: JSON.stringify({
                      model: selectedModel.model_id,
                      messages: [{ role: 'user', content: formatPrompt }],
                      temperature: 0.3,
                      max_tokens: 800
                    })
                  })
                  
                  if (formatResponse.ok) {
                    const formatData = await formatResponse.json()
                    finalResponse = formatData.choices[0].message.content
                  } else {
                    finalResponse = `📊 **Query Results**\n\nFound ${data.length} results. Here's a summary of the data:\n\n${JSON.stringify(data.slice(0, 3), null, 2)}`
                  }
                } else {
                  finalResponse = '📅 **No Data Found**\n\nNo matching data found for your query.'
                }
              }
            } catch (queryError) {
              console.error('Error executing AI-generated query:', queryError)
              // Fall back to AI processing
            }
          }
        } else {
          console.log('Failed to get SQL generation from AI, falling back to normal processing')
        }
      } catch (error) {
        console.error('Error in AI SQL generation:', error)
        // Fall back to normal AI processing
      }
    }
    // Check if the AI wants to execute a query from its response
    else if (aiResponseText.includes('EXECUTE_QUERY:') || /SELECT.*FROM/i.test(aiResponseText)) {
      try {
        // Extract SQL query from the AI response
        let sqlQuery = ''
        
        if (aiResponseText.includes('EXECUTE_QUERY:')) {
          const queryMatch = aiResponseText.match(/EXECUTE_QUERY:\s*([^\n]+)/)
          sqlQuery = queryMatch ? queryMatch[1].trim() : ''
        } else {
          // Look for SELECT statements in the response
          const selectMatch = aiResponseText.match(/SELECT[^;]+/i)
          sqlQuery = selectMatch ? selectMatch[0].trim() : ''
        }
        
        // Clean up the query
        sqlQuery = sqlQuery.replace(/```[^`]*```|```|`/g, '').trim()
        
        if (sqlQuery) {
          console.log(`Executing AI-generated query: ${sqlQuery}`)
          
          const { data, error } = await supabase.rpc('exec_sql', { 
            query: sqlQuery 
          })
          
          if (error) {
            console.error('Query error:', error)
            finalResponse = `❌ Query Error: ${error.message}`
          } else {
            dataResults.push(data)
            queryExecuted = sqlQuery
            queriesExecuted++
            
            console.log('Query results:', data)
            
            if (data && Array.isArray(data) && data.length > 0) {
              // Format AI-generated query results in a user-friendly way
              if (data[0].employee_name && data[0].role) {
                // This looks like schedule data
                const employees = data.map(row => `• ${row.employee_name} (${row.role}) - ${row.shift_time || 'Time TBD'}`).join('\n')
                finalResponse = `📋 **Query Results:**\n\n${employees}`
              } else {
                // Generic data formatting
                finalResponse = `📋 **Query Results:**\n\n${data.slice(0, 5).map(row => Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ')).join('\n')}`
              }
            } else {
              finalResponse = "📋 **No Results Found**\n\nNo data matches your query criteria."
            }
          }
        } else {
          console.log('Could not extract SQL query from AI response')
        }
      } catch (error) {
        console.error('Query execution error:', error)
        finalResponse = `❌ Execution Error: ${error.message}`
      }
    }

    // Parse suggested actions
    const suggestedActions: Array<{label: string, action: string, parameters?: Record<string, any>}> = []
    const actionMatches = aiResponseText.match(/SUGGEST_ACTION:\s*(\w+)\s*(.*?)(?=\n|$)/g) || []
    
    for (const actionMatch of actionMatches) {
      const parts = actionMatch.replace('SUGGEST_ACTION:', '').trim().split(' ')
      const actionName = parts[0]
      const actionParams = parts.slice(1).join(' ')
      
      const capability = actionCapabilities.find(a => a.name === actionName)
      if (capability) {
        suggestedActions.push({
          label: capability.description,
          action: actionName,
          parameters: actionParams ? JSON.parse(actionParams) : undefined
        })
      }
    }

    // Store conversation in database
    if (user_id) {
      try {
        // Store user message
        await supabase.from('messages').insert({
          contact_id: user_id,
          content: message,
          direction: 'inbound',
          status: 'delivered',
          ai_generated: false,
          metadata: { 
            conversation_id: conversationId,
            model_used: selectedModel.name
          }
        })

        // Store AI response
        await supabase.from('messages').insert({
          contact_id: user_id,
          content: finalResponse,
          direction: 'outbound',
          status: 'sent',
          ai_generated: true,
          metadata: {
            conversation_id: conversationId,
            model_used: selectedModel.name,
            tokens_used: selectedModel.max_tokens,
            queries_executed: queriesExecuted,
            actions_suggested: suggestedActions.length
          }
        })
      } catch (error) {
        console.error('Error storing conversation:', error)
      }
    }

    // Build comprehensive response
    const response: ChatResponse = {
      response: finalResponse,
      model_used: selectedModel.name,
      data_results: dataResults.length > 0 ? dataResults : undefined,
      suggested_actions: suggestedActions.length > 0 ? suggestedActions : undefined,
      conversation_id: conversationId,
      query_executed: queryExecuted || undefined,
      performance_metrics: {
        response_time_ms: Date.now() - startTime,
        model_selection_reason: `Selected ${selectedModel.name} for ${selectedModel.strengths.join(', ')}`,
        data_queries_executed: queriesExecuted,
        tokens_used: selectedModel.max_tokens
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Supercharged AI Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        performance_metrics: {
          response_time_ms: Date.now() - startTime,
          model_selection_reason: 'Error occurred',
          data_queries_executed: 0,
          tokens_used: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})