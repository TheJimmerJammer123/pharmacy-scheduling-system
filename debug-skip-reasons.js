const xlsx = require('xlsx');
const db = require('./services/databaseService');

console.log('🔍 DEBUGGING SKIP REASONS - DETAILED ANALYSIS');
console.log('=============================================');

async function debugSkipReasons() {
  const workbook = xlsx.readFile('/app/shift-detail.xlsx');
  const worksheet = workbook.Sheets['Shift Detail'];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const headerRow = rows[0];
  const indexMap = {};
  headerRow.forEach((header, idx) => {
    if (!header || typeof header !== 'string') return;
    const key = header.trim().toLowerCase();
    indexMap[key] = idx;
  });

  // Exact service pickValue and normalize functions
  function pickValue(row, indexMap, keys) {
    for (const key of keys) {
      if (indexMap[key] !== undefined) {
        const value = row[indexMap[key]];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
    return undefined;
  }

  function normalizeDate(value) {
    if (!value) return undefined;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const str = String(value).trim();
    if (/^\d+$/.test(str)) {
      try {
        const serial = parseInt(str, 10);
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + serial * 86400000);
        return date.toISOString().slice(0, 10);
      } catch (_) {}
    }
    const iso = new Date(str);
    if (!isNaN(iso.getTime())) {
      return iso.toISOString().slice(0, 10);
    }
    return undefined;
  }

  // Service key arrays
  const employeeKeys = ['employee name', 'employee', 'name'];
  const storeKeys = ['store number', 'store', 'site', 'location number', 'site number', 'scheduled site'];
  const dateKeys = ['date', 'shift date', 'work date', 'scheduled date'];
  const shiftStartKeys = ['shift start', 'start time', 'start'];
  const shiftEndKeys = ['shift end', 'end time', 'end'];

  // Skip reason tracking
  let reasons = {
    'no_employee_name': 0,
    'no_store_number': 0,
    'no_date': 0,
    'no_time_slot': 0,
    'invalid_store_number': 0,
    'invalid_date': 0,
    'no_shift_time': 0,
    'store_not_found': 0,
    'database_error': 0,
    'would_succeed': 0
  };

  console.log('🔬 Analyzing first 20 rows to find skip patterns...');

  const dataRows = rows.slice(1, 21); // Test first 20 rows
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    console.log(`\n📝 Row ${i + 1}:`);

    // Step 1: Extract employee name
    const rawEmployeeName = pickValue(row, indexMap, employeeKeys);
    const firstName = pickValue(row, indexMap, ['first name']);
    const lastName = pickValue(row, indexMap, ['last name']);
    const employee_name = rawEmployeeName || [firstName, lastName].filter(Boolean).join(' ').trim();
    
    if (!employee_name) {
      console.log('   ❌ Skip reason: NO_EMPLOYEE_NAME');
      reasons.no_employee_name++;
      continue;
    }

    // Step 2: Extract store
    const storeNumberStr = pickValue(row, indexMap, storeKeys);
    if (!storeNumberStr) {
      console.log('   ❌ Skip reason: NO_STORE_NUMBER');
      reasons.no_store_number++;
      continue;
    }

    // Step 3: Extract date
    const dateStr = pickValue(row, indexMap, dateKeys);
    if (!dateStr) {
      console.log('   ❌ Skip reason: NO_DATE');
      reasons.no_date++;
      continue;
    }

    // Step 4: Extract times
    const start = pickValue(row, indexMap, shiftStartKeys);
    const end = pickValue(row, indexMap, shiftEndKeys);
    if (!start && !end) {
      console.log('   ❌ Skip reason: NO_TIME_SLOT');
      reasons.no_time_slot++;
      continue;
    }

    console.log(`   ✅ Passed basic validation: ${employee_name}, ${storeNumberStr}, ${dateStr}, ${start}-${end}`);

    // Step 5: Parse store number
    let store_number;
    if (String(storeNumberStr).includes(' - ')) {
      store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
    } else {
      store_number = parseInt(String(storeNumberStr).replace(/[^0-9]/g, ''), 10);
    }
    
    if (!store_number || isNaN(store_number)) {
      console.log('   ❌ Skip reason: INVALID_STORE_NUMBER');
      reasons.invalid_store_number++;
      continue;
    }

    // Step 6: Parse date
    const date = normalizeDate(dateStr);
    if (!date) {
      console.log('   ❌ Skip reason: INVALID_DATE');
      reasons.invalid_date++;
      continue;
    }

    // Step 7: Create shift time
    const shift_time = start && end ? `${start} - ${end}` : (start || end);
    if (!shift_time) {
      console.log('   ❌ Skip reason: NO_SHIFT_TIME');
      reasons.no_shift_time++;
      continue;
    }

    console.log(`   ✅ Parsed successfully: store=${store_number}, date=${date}, shift=${shift_time}`);

    // Step 8: Check store exists
    try {
      const storeRes = await db.query('SELECT 1 FROM stores WHERE store_number = $1', [store_number]);
      if (storeRes.rowCount === 0) {
        console.log(`   ❌ Skip reason: STORE_NOT_FOUND (${store_number})`);
        reasons.store_not_found++;
        continue;
      }
    } catch (dbError) {
      console.log(`   ❌ Skip reason: DATABASE_ERROR (${dbError.message})`);
      reasons.database_error++;
      continue;
    }

    console.log('   ✅ WOULD SUCCEED - This record should be imported!');
    reasons.would_succeed++;
  }

  console.log('\n📊 SKIP ANALYSIS SUMMARY:');
  console.log('========================');
  Object.entries(reasons).forEach(([reason, count]) => {
    if (count > 0) {
      console.log(`   ${reason.toUpperCase().replace('_', ' ')}: ${count}`);
    }
  });

  const totalProcessed = Object.values(reasons).reduce((sum, count) => sum + count, 0);
  console.log(`\n   TOTAL PROCESSED: ${totalProcessed}`);
  console.log(`   SUCCESS RATE: ${((reasons.would_succeed / totalProcessed) * 100).toFixed(1)}%`);

  if (reasons.would_succeed === 0) {
    console.log('\n🚨 CRITICAL: No records would succeed - identified the issue!');
  } else {
    console.log('\n🤔 MYSTERY: Some records should succeed, but the service is still failing');
  }
}

debugSkipReasons()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });