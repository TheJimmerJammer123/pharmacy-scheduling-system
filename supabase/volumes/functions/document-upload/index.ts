import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  file_name: string
  file_type: 'excel' | 'pdf' | 'csv'
  file_size: number
  content: string // Base64 encoded file content
  metadata?: {
    description?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
  }
}

interface ProcessingStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  created_at: string
  updated_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file_name, file_type, file_size, content, metadata }: UploadRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate file type
    const allowedTypes = ['excel', 'pdf', 'csv']
    if (!allowedTypes.includes(file_type)) {
      throw new Error(`Unsupported file type: ${file_type}. Supported types: ${allowedTypes.join(', ')}`)
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file_size > maxSize) {
      throw new Error(`File too large: ${file_size} bytes. Maximum size: ${maxSize} bytes`)
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('document_imports')
      .insert({
        file_name,
        file_type,
        file_size,
        status: 'pending',
        progress: 0,
        message: 'File uploaded successfully, ready for processing',
        metadata: metadata || {},
        content: content // Store base64 content temporarily
      })
      .select()
      .single()

    if (importError) {
      throw new Error(`Failed to create import record: ${importError.message}`)
    }

    // Trigger processing based on file type
    let processingEndpoint = ''
    switch (file_type) {
      case 'excel':
        processingEndpoint = '/functions/v1/process-excel'
        break
      case 'pdf':
        processingEndpoint = '/functions/v1/process-pdf'
        break
      case 'csv':
        processingEndpoint = '/functions/v1/process-csv'
        break
    }

    // Start processing asynchronously
    if (processingEndpoint) {
      fetch(`${supabaseUrl}${processingEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          import_id: importRecord.id,
          file_name,
          file_type,
          content
        })
      }).catch(error => {
        console.error('Failed to trigger processing:', error)
        // Update import status to failed
        supabase
          .from('document_imports')
          .update({
            status: 'failed',
            message: `Failed to trigger processing: ${error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', importRecord.id)
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        import_id: importRecord.id,
        message: 'File uploaded successfully and processing started',
        status: 'pending',
        processing_endpoint: processingEndpoint
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 