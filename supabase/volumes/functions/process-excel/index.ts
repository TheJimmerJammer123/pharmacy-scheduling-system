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
  headers: string[]
  data: any[][]
}

interface ImportResult {
  sheets_processed: number
  total_records: number
  details: Record<string, any>
  summary: {
    employees_imported: number
    schedules_imported: number
    stores_imported: number
    errors: string[]
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let import_id: string = ''

  try {
    const { import_id: reqImportId, file_name, file_type, content }: ProcessingRequest = await req.json()
    import_id = reqImportId

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

    // Process Excel file
    const processingResult = await processExcelFile(fileBuffer, file_name)

    // Update progress
    await supabase
      .from('document_imports')
      .update({
        progress: 30,
        message: 'Excel file parsed, extracting and transforming data...',
        updated_at: new Date().toISOString()
      })
      .eq('id', import_id)

    // Process and import data with enhanced mapping
    const importResults = await processPharmacyData(supabase, processingResult.sheets)

    // Update final status
    await supabase
      .from('document_imports')
      .update({
        status: 'completed',
        progress: 100,
        message: `Successfully imported ${importResults.total_records} records. Employees: ${importResults.summary.employees_imported}, Schedules: ${importResults.summary.schedules_imported}, Stores: ${importResults.summary.stores_imported}`,
        metadata: {
          sheets_processed: importResults.sheets_processed,
          total_records: importResults.total_records,
          import_details: importResults.details,
          summary: importResults.summary
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
          error_details: { error: error.message, stack: error.stack },
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
    // Import xlsx library dynamically - try different CDNs
    let XLSX;
    try {
      XLSX = await import('https://cdn.skypack.dev/xlsx@0.18.5')
    } catch (error) {
      console.log('Trying alternative CDN...')
      try {
        XLSX = await import('https://esm.sh/xlsx@0.18.5')
      } catch (error2) {
        console.log('Trying npm CDN...')
        XLSX = await import('https://cdn.nest.land/xlsx@0.18.5')
      }
    }
    
    // Read the Excel file
    const workbook = XLSX.read(fileBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellStyles: false
    })
    
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

async function processPharmacyData(supabase: any, sheets: ExcelSheet[]): Promise<ImportResult> {
  const results: ImportResult = {
    sheets_processed: 0,
    total_records: 0,
    details: {},
    summary: {
      employees_imported: 0,
      schedules_imported: 0,
      stores_imported: 0,
      errors: []
    }
  }

  // Find the shift detail sheet
  const shiftDetailSheet = sheets.find(sheet => 
    sheet.name.toLowerCase().includes('shift detail') || 
    sheet.name.toLowerCase().includes('shift')
  )

  if (!shiftDetailSheet) {
    throw new Error('No shift detail sheet found in Excel file')
  }

  console.log(`Processing shift detail sheet: ${shiftDetailSheet.name}`)
  console.log(`Headers: ${JSON.stringify(shiftDetailSheet.headers)}`)
  console.log(`Data rows: ${shiftDetailSheet.data.length}`)

  try {
    // Extract and process employees
    const employees = extractEmployees(shiftDetailSheet)
    console.log(`Extracted ${employees.length} unique employees`)

    // Extract and process stores
    const stores = extractStores(shiftDetailSheet)
    console.log(`Extracted ${stores.length} unique stores`)

    // Extract and process schedules
    const schedules = extractSchedules(shiftDetailSheet)
    console.log(`Extracted ${schedules.length} schedule records`)

    // Import stores first (they're referenced by schedules)
    if (stores.length > 0) {
      const storeResults = await importStoresBatch(supabase, stores)
      results.summary.stores_imported = storeResults.successCount
      results.details.stores = storeResults
    }

    // Import employees
    if (employees.length > 0) {
      const employeeResults = await importEmployeesBatch(supabase, employees)
      results.summary.employees_imported = employeeResults.successCount
      results.details.employees = employeeResults
    }

    // Import schedules
    if (schedules.length > 0) {
      const scheduleResults = await importSchedulesBatch(supabase, schedules)
      results.summary.schedules_imported = scheduleResults.successCount
      results.details.schedules = scheduleResults
    }

    results.sheets_processed = 1
    results.total_records = employees.length + schedules.length + stores.length

  } catch (error) {
    console.error(`Error processing pharmacy data:`, error)
    results.summary.errors.push(error.message)
    results.details.error = error.message
  }

  return results
}

function extractEmployees(sheet: ExcelSheet): any[] {
  const employees = new Map<string, any>()
  
  // Find column indices
  const headers = sheet.headers.map(h => h.toLowerCase())
  const employeeIdIndex = headers.findIndex(h => h.includes('employee id'))
  const firstNameIndex = headers.findIndex(h => h.includes('first name'))
  const lastNameIndex = headers.findIndex(h => h.includes('last name'))
  const roleIndex = headers.findIndex(h => h.includes('role'))
  const employeeTypeIndex = headers.findIndex(h => h.includes('employee type'))

  if (employeeIdIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
    throw new Error('Required employee columns not found')
  }

  for (const row of sheet.data) {
    const employeeId = String(row[employeeIdIndex] || '').trim()
    if (!employeeId) continue

    const firstName = String(row[firstNameIndex] || '').trim()
    const lastName = String(row[lastNameIndex] || '').trim()
    const role = String(row[roleIndex] || '').trim()
    const employeeType = String(row[employeeTypeIndex] || '').trim()

    if (firstName && lastName) {
      const name = `${firstName} ${lastName}`.trim()
      const notes = `${role}${employeeType ? ` - ${employeeType}` : ''}`

      employees.set(employeeId, {
        name,
        phone: employeeId, // Use employee ID as phone for uniqueness
        email: null,
        status: 'active',
        priority: 'medium',
        notes: notes || null
      })
    }
  }

  return Array.from(employees.values())
}

function extractStores(sheet: ExcelSheet): any[] {
  const stores = new Map<string, any>()
  
  // Find column indices
  const headers = sheet.headers.map(h => h.toLowerCase())
  const scheduledSiteIndex = headers.findIndex(h => h.includes('scheduled site'))

  if (scheduledSiteIndex === -1) {
    throw new Error('Scheduled site column not found')
  }

  for (const row of sheet.data) {
    const siteName = String(row[scheduledSiteIndex] || '').trim()
    if (!siteName) continue

    // Parse site name with multiple patterns
    let storeNumber: number | null = null
    let city: string = ''
    let address: string = ''

    // Pattern 1: "79 - Syracuse (Electronics Pkwy)" - with address in parentheses
    const siteMatch1 = siteName.match(/^(\d+)\s*-\s*(.+?)\s*\((.+?)\)$/)
    if (siteMatch1) {
      storeNumber = parseInt(siteMatch1[1])
      city = siteMatch1[2].trim()
      address = siteMatch1[3].trim()
    } else {
      // Pattern 2: "102 - Randolph" - just store number and city
      const siteMatch2 = siteName.match(/^(\d+)\s*-\s*(.+)$/)
      if (siteMatch2) {
        storeNumber = parseInt(siteMatch2[1])
        city = siteMatch2[2].trim()
        address = city // Use city as address for now
      }
    }

    if (storeNumber) {
      stores.set(storeNumber.toString(), {
        store_number: storeNumber,
        address: address,
        city: city,
        state: 'NY', // Default to NY
        zip_code: '', // To be filled later
        phone: '', // To be filled later
        is_active: true
      })
    }
  }

  console.log(`Extracted ${stores.size} unique stores from site data`)
  return Array.from(stores.values())
}

function extractSchedules(sheet: ExcelSheet): any[] {
  const schedules = []
  
  // Find column indices
  const headers = sheet.headers.map(h => h.toLowerCase())
  const employeeIdIndex = headers.findIndex(h => h.includes('employee id'))
  const firstNameIndex = headers.findIndex(h => h.includes('first name'))
  const lastNameIndex = headers.findIndex(h => h.includes('last name'))
  const roleIndex = headers.findIndex(h => h.includes('role'))
  const employeeTypeIndex = headers.findIndex(h => h.includes('employee type'))
  const scheduledDateIndex = headers.findIndex(h => h.includes('scheduled date'))
  const startTimeIndex = headers.findIndex(h => h.includes('start time'))
  const endTimeIndex = headers.findIndex(h => h.includes('end time'))
  const scheduledHoursIndex = headers.findIndex(h => h.includes('scheduled hours'))
  const scheduledSiteIndex = headers.findIndex(h => h.includes('scheduled site'))

  if (scheduledDateIndex === -1 || startTimeIndex === -1 || endTimeIndex === -1) {
    throw new Error('Required schedule columns not found')
  }

  for (const row of sheet.data) {
    const scheduledDate = row[scheduledDateIndex]
    const startTime = row[startTimeIndex]
    const endTime = row[endTimeIndex]
    
    if (!scheduledDate || !startTime || !endTime) continue

    const employeeId = String(row[employeeIdIndex] || '').trim()
    const firstName = String(row[firstNameIndex] || '').trim()
    const lastName = String(row[lastNameIndex] || '').trim()
    const role = String(row[roleIndex] || '').trim()
    const employeeType = String(row[employeeTypeIndex] || '').trim()
    const scheduledHours = row[scheduledHoursIndex]
    const siteName = String(row[scheduledSiteIndex] || '').trim()

    // Extract store number from site name
    const siteMatch = siteName.match(/(\d+)\s*-\s*/)
    const storeNumber = siteMatch ? parseInt(siteMatch[1]) : null

    if (storeNumber && firstName && lastName) {
      const employeeName = `${firstName} ${lastName}`.trim()
      const shiftTime = `${startTime} - ${endTime}`

      schedules.push({
        store_number: storeNumber,
        date: formatDate(scheduledDate),
        employee_name: employeeName,
        employee_id: employeeId,
        role: role || null,
        employee_type: employeeType || null,
        shift_time: shiftTime,
        scheduled_hours: scheduledHours ? parseFloat(scheduledHours) : null
      })
    }
  }

  return schedules
}

function formatDate(dateValue: any): string {
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0]
  }
  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0]
  }
  return String(dateValue)
}

async function importStoresBatch(supabase: any, stores: any[]): Promise<any> {
  const batchSize = 100
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (let i = 0; i < stores.length; i += batchSize) {
    const batch = stores.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('stores')
        .upsert(batch, { onConflict: 'store_number' })

      if (error) {
        errorCount += batch.length
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        successCount += batch.length
      }
    } catch (error) {
      errorCount += batch.length
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
    }
  }

  return { successCount, errorCount, errors }
}

async function importEmployeesBatch(supabase: any, employees: any[]): Promise<any> {
  const batchSize = 100
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('contacts')
        .upsert(batch, { onConflict: 'phone' })

      if (error) {
        errorCount += batch.length
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        successCount += batch.length
      }
    } catch (error) {
      errorCount += batch.length
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
    }
  }

  return { successCount, errorCount, errors }
}

async function importSchedulesBatch(supabase: any, schedules: any[]): Promise<any> {
  const batchSize = 100
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (let i = 0; i < schedules.length; i += batchSize) {
    const batch = schedules.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('store_schedules')
        .insert(batch)

      if (error) {
        errorCount += batch.length
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        successCount += batch.length
      }
    } catch (error) {
      errorCount += batch.length
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
    }
  }

  return { successCount, errorCount, errors }
} 