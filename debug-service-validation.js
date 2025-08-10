const xlsx = require('xlsx');

console.log('🔍 DEBUGGING SERVICE VALIDATION LOGIC');
console.log('=====================================');

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

// Exact service date normalization
function normalizeDate(value) {
  if (!value) return undefined;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  // Try Excel serial date
  if (/^\d+$/.test(str)) {
    try {
      const serial = parseInt(str, 10);
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + serial * 86400000);
      return date.toISOString().slice(0, 10);
    } catch (_) {}
  }
  // Try YYYY-MM-DD or MM/DD/YYYY
  const iso = new Date(str);
  if (!isNaN(iso.getTime())) {
    return iso.toISOString().slice(0, 10);
  }
  return undefined;
}

// Test with exact service key arrays (UPDATED - without 'employee id' in employeeKeys)
const employeeKeys = ['employee name', 'employee', 'name', 'first name', 'last name'];
const storeKeys = ['store number', 'store', 'site', 'location number', 'site number', 'scheduled site'];
const dateKeys = ['date', 'shift date', 'work date', 'scheduled date'];
const shiftStartKeys = ['shift start', 'start time', 'start'];
const shiftEndKeys = ['shift end', 'end time', 'end'];

console.log('\n🔬 Testing first 5 data rows with exact service logic:');

// Test first 5 data rows
const dataRows = rows.slice(1, 6);
let passCount = 0;
let failCount = 0;

for (let i = 0; i < dataRows.length; i++) {
  const row = dataRows[i];
  
  // Extract core employee info - EXACT service logic
  const rawEmployeeName = pickValue(row, indexMap, employeeKeys);
  const firstName = pickValue(row, indexMap, ['first name']);
  const lastName = pickValue(row, indexMap, ['last name']);
  const employee_name = rawEmployeeName || [firstName, lastName].filter(Boolean).join(' ').trim();

  // Extract schedule info
  const storeNumberStr = pickValue(row, indexMap, storeKeys);
  const dateStr = pickValue(row, indexMap, dateKeys);
  const start = pickValue(row, indexMap, shiftStartKeys);
  const end = pickValue(row, indexMap, shiftEndKeys);

  console.log(`\n📝 Row ${i + 1}:`);
  console.log(`   Raw employee name: "${rawEmployeeName || 'undefined'}"`);
  console.log(`   First name: "${firstName || 'undefined'}"`);
  console.log(`   Last name: "${lastName || 'undefined'}"`);
  console.log(`   Final employee name: "${employee_name}"`);
  console.log(`   Store: "${storeNumberStr || 'undefined'}"`);
  console.log(`   Date: "${dateStr || 'undefined'}"`);
  console.log(`   Start: "${start || 'undefined'}"`);
  console.log(`   End: "${end || 'undefined'}"`);

  // Service validation check 1: Basic required fields
  const basicCheck = !!(employee_name && storeNumberStr && dateStr && (start && end));
  console.log(`   Basic validation: ${basicCheck ? '✅ PASS' : '❌ FAIL'}`);

  if (!basicCheck) {
    failCount++;
    continue;
  }

  // Service validation check 2: Store number parsing
  let store_number;
  if (String(storeNumberStr).includes(' - ')) {
    store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
  } else {
    store_number = parseInt(String(storeNumberStr).replace(/[^0-9]/g, ''), 10);
  }
  
  const date = normalizeDate(dateStr);
  const shift_time = start && end ? `${start} - ${end}` : (start || end);

  console.log(`   Parsed store number: ${store_number}`);
  console.log(`   Normalized date: "${date}"`);
  console.log(`   Shift time: "${shift_time}"`);

  // Service validation check 3: Final validation
  const finalCheck = !!(store_number && date && shift_time);
  console.log(`   Final validation: ${finalCheck ? '✅ PASS' : '❌ FAIL'}`);

  if (finalCheck) {
    passCount++;
  } else {
    failCount++;
  }
}

console.log(`\n📊 VALIDATION SUMMARY:`);
console.log(`   ✅ Rows that would pass: ${passCount}`);
console.log(`   ❌ Rows that would fail: ${failCount}`);
console.log(`   Expected import rate: ${passCount}/${passCount + failCount} (${Math.round(passCount/(passCount + failCount)*100)}%)`);

if (passCount === 0) {
  console.log('\n🚨 CRITICAL: No rows would pass validation - this explains why 0 records are imported!');
} else {
  console.log('\n✅ Some rows should pass - the issue may be elsewhere in the service');
}