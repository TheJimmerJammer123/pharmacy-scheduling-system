import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingRequest {
  import_id: string
  file_name: string
  file_type: string
  content: string // Base64 encoded Excel file
}

interface ExcelSheet {
  name: string
  data: any[][]
  headers: string[]
}

interface DataMapping {
  sheet_name: string
  target_table: string
  column_mappings: Record<string, string>
  transformation_rules?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { import_id, file_name, file_type, content }: ProcessingRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update import status to processing
    await supabase
      .from('document_imports')
      .update({
        status: 'processing',
        progress: 10,
        message: 'Starting Excel file processing...',
        updated_at: new Date().toISOString()
      })
      .eq('id', import_id)

    // Decode base64 content
    const fileBuffer = Uint8Array.from(atob(content), c => c.charCodeAt(0))

    // Process Excel file using external service or library
    // For now, we'll use a simple approach and call an external processing service
    const processingResult = await processExcelFile(fileBuffer, file_name)

    // Update progress
    await supabase
      .from('document_imports')
      .update({
        progress: 50,
        message: 'Excel file parsed, mapping data to database schema...',
        updated_at: new Date().toISOString()
      })
      .eq('id', import_id)

    // Map and import data
    const importResults = await importExcelData(supabase, processingResult.sheets)

    // Update final status
    await supabase
      .from('document_imports')
      .update({
        status: 'completed',
        progress: 100,
        message: `Successfully imported ${importResults.total_records} records from ${importResults.sheets_processed} sheets`,
        metadata: {
          sheets_processed: importResults.sheets_processed,
          total_records: importResults.total_records,
          import_details: importResults.details
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', import_id)

    return new Response(
      JSON.stringify({
        success: true,
        import_id,
        message: 'Excel file processed successfully',
        results: importResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Excel processing error:', error)
    
    // Update import status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('document_imports')
        .update({
          status: 'failed',
          message: `Processing failed: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', import_id)
    } catch (updateError) {
      console.error('Failed to update import status:', updateError)
    }

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

async function processExcelFile(fileBuffer: Uint8Array, fileName: string): Promise<{ sheets: ExcelSheet[] }> {
  try {
    // Import xlsx library dynamically
    const XLSX = await import('https://cdn.skypack.dev/xlsx@0.18.5')
    
    // Read the Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'array' })
    
    const sheets: ExcelSheet[] = []
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert sheet to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })
      
      if (jsonData.length > 0) {
        // First row contains headers
        const headers = jsonData[0] as string[]
        // Rest of the rows contain data
        const data = jsonData.slice(1) as any[][]
        
        sheets.push({
          name: sheetName,
          headers: headers.map(h => String(h || '').trim()),
          data: data.filter(row => row.some(cell => cell !== null && cell !== ''))
        })
      }
    }
    
    console.log(`Processed Excel file ${fileName}: ${sheets.length} sheets found`)
    for (const sheet of sheets) {
      console.log(`  Sheet "${sheet.name}": ${sheet.headers.length} columns, ${sheet.data.length} rows`)
    }
    
    return { sheets }
  } catch (error) {
    console.error('Error processing Excel file:', error)
    throw new Error(`Failed to process Excel file: ${error.message}`)
  }
}

async function importExcelData(supabase: any, sheets: ExcelSheet[]): Promise<any> {
  const results = {
    sheets_processed: 0,
    total_records: 0,
    details: {}
  }

  for (const sheet of sheets) {
    try {
      console.log(`Processing sheet: ${sheet.name}`)
      console.log(`Headers: ${JSON.stringify(sheet.headers)}`)
      console.log(`Data rows: ${sheet.data.length}`)

      // Smart mapping based on sheet content and headers
      const tableName = determineTargetTable(sheet)
      const records = mapSheetToRecords(sheet, tableName)

      if (tableName && records.length > 0) {
        console.log(`Attempting to insert ${records.length} records into ${tableName}`)
        console.log(`Sample record:`, records[0])

        const { data, error } = await supabase
          .from(tableName)
          .insert(records)

        if (error) {
          console.error(`Error importing ${tableName}:`, error)
          results.details[sheet.name] = { 
            error: error.message,
            table: tableName,
            attempted_records: records.length
          }
        } else {
          results.sheets_processed++
          results.total_records += records.length
          results.details[sheet.name] = { 
            records_imported: records.length,
            table: tableName,
            columns_mapped: sheet.headers.length
          }
        }
      } else {
        results.details[sheet.name] = { 
          error: 'No suitable table mapping found or no valid records',
          headers: sheet.headers,
          data_preview: sheet.data.slice(0, 3)
        }
      }
    } catch (error) {
      console.error(`Error processing sheet ${sheet.name}:`, error)
      results.details[sheet.name] = { error: error.message }
    }
  }

  return results
}

function determineTargetTable(sheet: ExcelSheet): string {
  const headers = sheet.headers.map(h => h.toLowerCase())
  const sheetName = sheet.name.toLowerCase()

  // Check for store data
  if (sheetName.includes('store') || headers.some(h => h.includes('store'))) {
    return 'stores'
  }

  // Check for schedule/shift data
  if (sheetName.includes('shift') || sheetName.includes('schedule') || 
      headers.some(h => h.includes('shift') || h.includes('schedule') || h.includes('date'))) {
    return 'store_schedules'
  }

  // Check for employee/contact data
  if (sheetName.includes('employee') || sheetName.includes('contact') ||
      headers.some(h => h.includes('name') || h.includes('phone') || h.includes('email'))) {
    return 'contacts'
  }

  return ''
}

function mapSheetToRecords(sheet: ExcelSheet, tableName: string): any[] {
  const headers = sheet.headers.map(h => h.toLowerCase().trim())
  
  return sheet.data.map(row => {
    const record: any = {}
    
    switch (tableName) {
      case 'stores':
        // Map common store fields
        headers.forEach((header, index) => {
          const value = row[index]
          if (value == null || value === '') return
          
          if (header.includes('store') && header.includes('number')) record.store_number = value
          else if (header.includes('address')) record.address = value
          else if (header.includes('city')) record.city = value
          else if (header.includes('state')) record.state = value
          else if (header.includes('zip')) record.zip_code = value
          else if (header.includes('phone')) record.phone = value
          else if (header.includes('name')) record.store_name = value
        })
        break

      case 'contacts':
        headers.forEach((header, index) => {
          const value = row[index]
          if (value == null || value === '') return
          
          if (header.includes('name')) record.name = value
          else if (header.includes('phone')) record.phone = value
          else if (header.includes('email')) record.email = value
          else if (header.includes('status')) record.status = value
          else if (header.includes('priority')) record.priority = value
          else if (header.includes('role')) record.role = value
        })
        break

      case 'store_schedules':
        headers.forEach((header, index) => {
          const value = row[index]
          if (value == null || value === '') return
          
          if (header.includes('store')) record.store_number = value
          else if (header.includes('date')) record.date = formatDate(value)
          else if (header.includes('employee') || header.includes('name')) record.employee_name = value
          else if (header.includes('shift') || header.includes('time')) record.shift_time = value
          else if (header.includes('role') || header.includes('position')) record.role = value
          else if (header.includes('start')) record.start_time = value
          else if (header.includes('end')) record.end_time = value
        })
        break
    }
    
    return record
  }).filter(record => Object.keys(record).length > 0)
}

function formatDate(value: any): string | null {
  if (!value) return null
  
  try {
    // Handle Excel date serial numbers
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
    
    // Handle string dates
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
    
    return String(value)
  } catch (error) {
    console.warn('Date formatting error:', error)
    return String(value)
  }
} 