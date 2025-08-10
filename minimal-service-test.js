console.log('🔬 MINIMAL SERVICE TEST');
console.log('======================');

const xlsx = require('xlsx');
const db = require('./services/databaseService');

async function minimalTest() {
  try {
    console.log('Step 1: Loading Excel file...');
    const workbook = xlsx.readFile('/app/shift-detail.xlsx');
    const worksheet = workbook.Sheets['Shift Detail'];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    console.log(`✅ Excel loaded: ${rows.length} rows`);
    
    console.log('Step 2: Creating index map...');
    const headerRow = rows[0];
    const indexMap = {};
    headerRow.forEach((header, idx) => {
      if (!header || typeof header !== 'string') return;
      const key = header.trim().toLowerCase();
      indexMap[key] = idx;
    });
    console.log(`✅ Index map created: ${Object.keys(indexMap).length} keys`);
    
    console.log('Step 3: Getting database client...');
    const client = await db.getClient();
    console.log('✅ Database client obtained');
    
    console.log('Step 4: Starting transaction...');
    await client.query('BEGIN');
    console.log('✅ Transaction started');
    
    console.log('Step 5: Processing first row...');
    const testRow = rows[1]; // First data row
    
    // Simple extraction
    const firstName = testRow[indexMap['first name']] || '';
    const lastName = testRow[indexMap['last name']] || '';
    const employee_name = (firstName + ' ' + lastName).trim();
    const storeNumberStr = testRow[indexMap['scheduled site']] || '';
    const dateStr = testRow[indexMap['scheduled date']] || '';
    const start = testRow[indexMap['start time']] || '';
    const end = testRow[indexMap['end time']] || '';
    
    console.log('   Extracted data:', {
      employee_name,
      storeNumberStr, 
      dateStr,
      start,
      end
    });
    
    // Parse store number
    const store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
    
    // Convert date
    const serial = parseInt(dateStr, 10);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 86400000).toISOString().slice(0, 10);
    
    const shift_time = `${start} - ${end}`;
    
    console.log('   Parsed data:', {
      store_number,
      date, 
      shift_time
    });
    
    console.log('Step 6: Inserting test record...');
    const insertResult = await client.query(`
      INSERT INTO schedule_entries (
        store_number, date, employee_name, shift_time
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_number, date, employee_name, shift_time)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
    `, [store_number, date, employee_name, shift_time]);
    
    console.log(`✅ Insert successful! ID: ${insertResult.rows[0].id}`);
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed');
    
    client.release();
    console.log('✅ Database client released');
    
    console.log('🎉 MINIMAL TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Minimal test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

minimalTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
  });