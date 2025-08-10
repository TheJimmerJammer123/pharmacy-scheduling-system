const xlsx = require('xlsx');
const db = require('./services/databaseService');

console.log('🚀 WORKING IMPORT SERVICE - PRODUCTION TEST');
console.log('==============================================');

async function workingImportService(filePath) {
  const startTime = Date.now();
  
  try {
    console.log('📊 Loading Excel file...');
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets['Shift Detail'];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    console.log(`✅ Excel loaded: ${rows.length} rows total`);
    
    // Create index map
    const headerRow = rows[0];
    const indexMap = {};
    headerRow.forEach((header, idx) => {
      if (!header || typeof header !== 'string') return;
      const key = header.trim().toLowerCase();
      indexMap[key] = idx;
    });
    console.log(`📋 Headers mapped: ${Object.keys(indexMap).length} columns`);
    
    // Get database client
    console.log('🔌 Connecting to database...');
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 Transaction started');
      
      const dataRows = rows.slice(1); // Skip header
      console.log(`📝 Processing ${dataRows.length} data rows...`);
      
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          
          // Show progress every 1000 rows
          if (i % 1000 === 0) {
            console.log(`   Progress: ${i}/${dataRows.length} (${Math.round(i/dataRows.length*100)}%)`);
          }
          
          // Extract employee name
          const firstName = row[indexMap['first name']] || '';
          const lastName = row[indexMap['last name']] || '';
          const employee_name = (firstName + ' ' + lastName).trim();
          
          // Extract other required fields
          const storeNumberStr = row[indexMap['scheduled site']] || '';
          const dateStr = row[indexMap['scheduled date']] || '';
          const start = row[indexMap['start time']] || '';
          const end = row[indexMap['end time']] || '';
          
          // Basic validation
          if (!employee_name || !storeNumberStr || !dateStr || !start || !end) {
            skipped++;
            continue;
          }
          
          // Parse store number
          const store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
          if (!store_number || isNaN(store_number)) {
            skipped++;
            continue;
          }
          
          // Convert Excel serial date
          const serial = parseInt(dateStr, 10);
          if (!serial || isNaN(serial)) {
            skipped++;
            continue;
          }
          
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const date = new Date(excelEpoch.getTime() + serial * 86400000).toISOString().slice(0, 10);
          const shift_time = `${start} - ${end}`;
          
          // Check if store exists
          const storeCheck = await client.query('SELECT 1 FROM stores WHERE store_number = $1', [store_number]);
          if (storeCheck.rowCount === 0) {
            skipped++;
            continue;
          }
          
          // Check for existing record
          const existingCheck = await client.query(
            'SELECT 1 FROM schedule_entries WHERE store_number=$1 AND date=$2 AND employee_name=$3 AND shift_time=$4',
            [store_number, date, employee_name, shift_time]
          );
          
          // Insert/Update record
          await client.query(`
            INSERT INTO schedule_entries (
              store_number, date, employee_name, shift_time,
              employee_id, region, role, employee_type, scheduled_hours,
              start_time, end_time, published
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (store_number, date, employee_name, shift_time)
            DO UPDATE SET 
              updated_at = NOW()
          `, [
            store_number, date, employee_name, shift_time,
            row[indexMap['employee id']] || null,
            row[indexMap['region']] || null, 
            row[indexMap['role']] || null,
            row[indexMap['employee type']] || null,
            parseFloat(row[indexMap['scheduled hours']]) || null,
            start, end, true
          ]);
          
          if (existingCheck.rowCount > 0) {
            updated++;
          } else {
            inserted++;
          }
          
        } catch (rowError) {
          errors.push({ row: i + 1, error: rowError.message });
          if (errors.length < 10) { // Only log first 10 errors
            console.log(`   ⚠️ Row ${i + 1} error: ${rowError.message}`);
          }
        }
      }
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed');
      
      const duration = Date.now() - startTime;
      console.log(`\n🎉 IMPORT COMPLETED SUCCESSFULLY!`);
      console.log(`📊 Final Statistics:`);
      console.log(`   ✅ Inserted: ${inserted.toLocaleString()}`);
      console.log(`   🔄 Updated: ${updated.toLocaleString()}`);
      console.log(`   ⏭️ Skipped: ${skipped.toLocaleString()}`);
      console.log(`   ❌ Errors: ${errors.length}`);
      console.log(`   ⏱️ Duration: ${(duration/1000).toFixed(1)}s`);
      console.log(`   📈 Rate: ${Math.round((inserted + updated)/(duration/1000))} records/sec`);
      
      return {
        success: true,
        inserted,
        updated,
        skipped,
        errors: errors.length,
        duration_ms: duration
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

// Run the working import service
workingImportService('/app/shift-detail.xlsx')
  .then(result => {
    console.log('🎯 Import completed with result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Import failed:', error);
    process.exit(1);
  });