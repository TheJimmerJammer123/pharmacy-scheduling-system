const XLSX = require('xlsx');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'pharmacy',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password123',
});

// Improved date conversion function
function convertExcelDate(dateValue) {
  // If it's already a valid date string, return it
  if (typeof dateValue === 'string' && dateValue.includes('-')) {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  
  // If it's a number (Excel serial date)
  if (typeof dateValue === 'number' || !isNaN(parseInt(dateValue))) {
    const serial = typeof dateValue === 'number' ? dateValue : parseInt(dateValue);
    
    // Excel date serial number conversion (1900 date system)
    // Note: Excel incorrectly treats 1900 as a leap year, so we account for that
    const excelEpoch = new Date(Date.UTC(1900, 0, 1)); // January 1, 1900
    const daysSinceEpoch = serial - 1; // Excel counts from 1, not 0
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 86400000);
    
    // Handle Excel's leap year bug (Feb 29, 1900 doesn't exist)
    if (serial > 59) {
      date.setTime(date.getTime() - 86400000); // Subtract one day
    }
    
    return date.toISOString().slice(0, 10);
  }
  
  // If it's a JavaScript Date object
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 10);
  }
  
  // Try parsing as a string date
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  
  // Fallback - return null for invalid dates
  console.log('Could not parse date:', dateValue, typeof dateValue);
  return null;
}

async function reimportWithBetterDates() {
  const client = await pool.connect();
  
  try {
    console.log('Starting improved Excel re-import...');
    
    // First, let's clear the existing imported data (keep test data)
    const deleteResult = await client.query(
      "DELETE FROM schedule_entries WHERE created_at >= '2025-08-10T19:35:55.103Z'"
    );
    console.log(`Cleared ${deleteResult.rowCount} existing imported records`);
    
    // Read the original Excel file
    const workbook = XLSX.readFile('shift-detail-export.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      throw new Error('Excel file appears to be empty or has no data rows');
    }
    
    const headers = data[0].map(h => String(h || '').toLowerCase());
    console.log('Excel headers:', headers);
    
    // Create index mapping
    const indexMap = {};
    const requiredFields = ['first name', 'last name', 'store number', 'date', 'start time', 'end time'];
    
    headers.forEach((header, index) => {
      if (requiredFields.some(field => header.includes(field.split(' ')[0]))) {
        const key = requiredFields.find(field => header.includes(field.split(' ')[0])) || header;
        indexMap[key] = index;
      }
    });
    
    console.log('Index mapping:', indexMap);
    
    let processed = 0;
    let skipped = 0;
    let imported = 0;
    
    // Process each row with improved date handling
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      processed++;
      
      // Extract data
      const firstName = row[indexMap['first name']] || '';
      const lastName = row[indexMap['last name']] || '';
      const employee_name = (firstName + ' ' + lastName).trim();
      const storeNumberStr = row[indexMap['store number']] || '';
      const dateValue = row[indexMap['date']]; // Don't convert to string yet
      const start = row[indexMap['start time']] || '';
      const end = row[indexMap['end time']] || '';
      
      // Basic validation
      if (!employee_name || !storeNumberStr || dateValue === undefined || dateValue === null || !start || !end) {
        console.log(`Row ${i}: Missing data -`, { employee_name, storeNumberStr, dateValue, start, end });
        skipped++;
        continue;
      }
      
      // Parse store number
      const store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
      if (!store_number || isNaN(store_number)) {
        console.log(`Row ${i}: Invalid store number:`, storeNumberStr);
        skipped++;
        continue;
      }
      
      // Convert date with improved logic
      const date = convertExcelDate(dateValue);
      if (!date) {
        console.log(`Row ${i}: Could not parse date:`, dateValue);
        skipped++;
        continue;
      }
      
      console.log(`Row ${i}: ${employee_name} at Store ${store_number} on ${date} (${start}-${end})`);
      
      const shift_time = `${start} - ${end}`;
      
      // Insert into database
      try {
        await client.query(`
          INSERT INTO schedule_entries (
            store_number, date, employee_name, shift_time, notes,
            employee_id, region, role, employee_type, scheduled_hours,
            start_time, end_time, published
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (store_number, date, employee_name, shift_time)
          DO UPDATE SET 
            notes = EXCLUDED.notes,
            updated_at = NOW()
        `, [
          store_number,
          date,
          employee_name,
          shift_time,
          null, // notes
          null, // employee_id
          null, // region
          null, // role
          null, // employee_type
          null, // scheduled_hours
          start, // start_time
          end,   // end_time
          true   // published
        ]);
        
        imported++;
      } catch (error) {
        console.error(`Row ${i}: Database error:`, error.message);
        skipped++;
      }
      
      if (processed % 100 === 0) {
        console.log(`Progress: ${processed} processed, ${imported} imported, ${skipped} skipped`);
      }
    }
    
    console.log(`\nImport complete:`);
    console.log(`- Total processed: ${processed}`);
    console.log(`- Successfully imported: ${imported}`);
    console.log(`- Skipped: ${skipped}`);
    
    // Check unique dates after import
    const dateCheck = await client.query(`
      SELECT date, COUNT(*) as count 
      FROM schedule_entries 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY date 
      ORDER BY date
    `);
    
    console.log('\nDate distribution in imported data:');
    dateCheck.rows.forEach(row => {
      console.log(`${row.date}: ${row.count} records`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
reimportWithBetterDates();