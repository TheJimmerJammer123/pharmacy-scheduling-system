const xlsx = require('xlsx');
const db = require('./services/databaseService');

console.log('🔍 COMPREHENSIVE IMPORT FLOW DEBUGGING');
console.log('======================================');

async function debugCompleteFlow() {
  // Read Excel file directly  
  const workbook = xlsx.readFile('/app/shift-detail.xlsx');
  const worksheet = workbook.Sheets['Shift Detail'];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log('📊 Excel file loaded successfully');
  console.log('   Total rows:', rows.length);

  // Replicate exact service logic
  const headerRow = rows[0];
  const indexMap = {};
  headerRow.forEach((header, idx) => {
    if (!header || typeof header !== 'string') return;
    const key = header.trim().toLowerCase();
    indexMap[key] = idx;
  });

  console.log('📋 Index map created:', Object.keys(indexMap).length, 'keys');

  // Exact service pickValue function
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

  // Updated service key arrays (FIXED - no first/last name in employeeKeys)
  const employeeKeys = ['employee name', 'employee', 'name'];
  const storeKeys = ['store number', 'store', 'site', 'location number', 'site number', 'scheduled site'];
  const dateKeys = ['date', 'shift date', 'work date', 'scheduled date'];
  const shiftStartKeys = ['shift start', 'start time', 'start'];
  const shiftEndKeys = ['shift end', 'end time', 'end'];

  console.log('\n🔬 Testing first 3 data rows with COMPLETE service flow:');

  let passedValidation1 = 0;
  let passedValidation2 = 0;
  let passedValidation3 = 0;
  let passedStoreCheck = 0;

  // Test first 3 data rows with complete flow
  const dataRows = rows.slice(1, 4);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    console.log(`\n📝 Row ${i + 1} - COMPLETE FLOW SIMULATION:`);
    
    // Step 1: Extract employee name (UPDATED LOGIC)
    const rawEmployeeName = pickValue(row, indexMap, employeeKeys);
    const firstName = pickValue(row, indexMap, ['first name']);
    const lastName = pickValue(row, indexMap, ['last name']);
    const employee_name = rawEmployeeName || [firstName, lastName].filter(Boolean).join(' ').trim();
    
    console.log(`   rawEmployeeName: "${rawEmployeeName || 'undefined'}"`);
    console.log(`   firstName: "${firstName || 'undefined'}"`);
    console.log(`   lastName: "${lastName || 'undefined'}"`);
    console.log(`   final employee_name: "${employee_name}"`);

    // Step 2: Extract other required fields
    const storeNumberStr = pickValue(row, indexMap, storeKeys);
    const dateStr = pickValue(row, indexMap, dateKeys);
    const start = pickValue(row, indexMap, shiftStartKeys);
    const end = pickValue(row, indexMap, shiftEndKeys);
    
    console.log(`   storeNumberStr: "${storeNumberStr || 'undefined'}"`);
    console.log(`   dateStr: "${dateStr || 'undefined'}"`);
    console.log(`   start: "${start || 'undefined'}"`);
    console.log(`   end: "${end || 'undefined'}"`);

    // Step 3: First validation check (!start && !end) condition
    const validation1 = !!(employee_name && storeNumberStr && dateStr && (start && end));
    console.log(`   🔍 Validation 1 (basic): ${validation1 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!validation1) {
      console.log('   ⛔ Would be skipped at validation 1');
      continue;
    }
    passedValidation1++;

    // Step 4: Parse store number and date
    let store_number;
    if (String(storeNumberStr).includes(' - ')) {
      store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
    } else {
      store_number = parseInt(String(storeNumberStr).replace(/[^0-9]/g, ''), 10);
    }
    
    // Normalize date
    function normalizeDate(value) {
      if (!value) return undefined;
      const str = String(value).trim();
      if (/^\d+$/.test(str)) {
        try {
          const serial = parseInt(str, 10);
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const date = new Date(excelEpoch.getTime() + serial * 86400000);
          return date.toISOString().slice(0, 10);
        } catch (_) {}
      }
      return undefined;
    }
    
    const date = normalizeDate(dateStr);
    const shift_time = start && end ? `${start} - ${end}` : (start || end);

    console.log(`   parsed store_number: ${store_number}`);
    console.log(`   normalized date: "${date}"`);
    console.log(`   shift_time: "${shift_time}"`);

    // Step 5: Second validation check
    const validation2 = !!(store_number && date && shift_time);
    console.log(`   🔍 Validation 2 (parsed): ${validation2 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!validation2) {
      console.log('   ⛔ Would be skipped at validation 2');
      continue;
    }
    passedValidation2++;

    // Step 6: Store FK check (database query)
    try {
      const storeRes = await db.query('SELECT 1 FROM stores WHERE store_number = $1', [store_number]);
      const storeExists = storeRes.rowCount > 0;
      console.log(`   🔍 Store FK check: ${storeExists ? '✅ PASS' : '❌ FAIL'} (store ${store_number})`);
      
      if (!storeExists) {
        console.log('   ⛔ Would be skipped - store not found');
        continue;
      }
      passedStoreCheck++;

      // Step 7: Conflict check  
      const conflictRes = await db.query('SELECT 1 FROM schedule_entries WHERE store_number=$1 AND date=$2 AND employee_name=$3 AND shift_time=$4', [store_number, date, employee_name, shift_time]);
      const hasConflict = conflictRes.rowCount > 0;
      console.log(`   🔍 Conflict check: ${hasConflict ? 'UPDATE' : 'INSERT'}`);

      console.log('   ✅ Would complete successfully!');
      passedValidation3++;

    } catch (dbError) {
      console.log(`   ❌ Database error: ${dbError.message}`);
    }
  }

  console.log(`\n📊 DEBUGGING SUMMARY:`);
  console.log(`   Passed Validation 1 (basic): ${passedValidation1}/3`);
  console.log(`   Passed Validation 2 (parsed): ${passedValidation2}/3`);
  console.log(`   Passed Store FK Check: ${passedStoreCheck}/3`);
  console.log(`   Would Complete Successfully: ${passedValidation3}/3`);

  if (passedValidation3 === 0) {
    console.log('\n🚨 CRITICAL: No records would complete - found the root cause!');
  } else {
    console.log('\n✅ Some records should import - the issue may be in transaction handling');
  }
}

// Run debugging
debugCompleteFlow()
  .then(() => {
    console.log('🎉 Debugging completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debugging failed:', error);
    process.exit(1);
  });