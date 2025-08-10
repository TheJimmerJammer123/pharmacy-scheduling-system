const xlsx = require('xlsx');
const fs = require('fs');

console.log('🔬 DIRECT EXCEL ANALYSIS - No Service Wrapper');
console.log('==============================================');

// Read Excel file directly  
const workbook = xlsx.readFile('/app/shift-detail.xlsx');
const worksheet = workbook.Sheets['Shift Detail'];
const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('📊 Raw Excel Analysis:');
console.log('   Total rows:', rows.length);
console.log('   Header row length:', rows[0].length);

// Extract headers and create index map
const headers = rows[0];
const indexMap = {};
headers.forEach((header, idx) => {
  if (header && typeof header === 'string') {
    const key = header.trim().toLowerCase();
    indexMap[key] = idx;
  }
});

console.log('\n📋 Header Analysis:');
console.log('   Headers found:', headers.length);
console.log('   Index map keys:', Object.keys(indexMap).length);
console.log('   Key mappings:');
Object.keys(indexMap).forEach(key => {
  console.log(`     "${key}" -> column ${indexMap[key]}`);
});

// Test key lookups
const testKeys = [
  ['employee id', 'first name', 'last name'],
  ['scheduled site'],
  ['scheduled date'], 
  ['start time'],
  ['end time']
];

console.log('\n🔍 Key Lookup Tests:');
testKeys.forEach((keyGroup, groupIdx) => {
  const groupNames = ['Employee Keys', 'Store Keys', 'Date Keys', 'Start Keys', 'End Keys'];
  console.log(`   ${groupNames[groupIdx]}:`);
  
  keyGroup.forEach(key => {
    const found = indexMap[key] !== undefined;
    const colIndex = indexMap[key];
    console.log(`     "${key}" -> ${found ? 'Found at column ' + colIndex : 'NOT FOUND'}`);
  });
});

// Test sample row data extraction
if (rows.length > 1) {
  console.log('\n📊 Sample Row Analysis:');
  const sampleRow = rows[1];
  
  const firstName = sampleRow[indexMap['first name']] || '';
  const lastName = sampleRow[indexMap['last name']] || '';
  const employeeName = (firstName + ' ' + lastName).trim();
  const storeInfo = sampleRow[indexMap['scheduled site']] || '';
  const dateValue = sampleRow[indexMap['scheduled date']] || '';
  const startTime = sampleRow[indexMap['start time']] || '';
  const endTime = sampleRow[indexMap['end time']] || '';
  
  console.log('   Employee Name:', '"' + employeeName + '"');
  console.log('   Store Info:', '"' + storeInfo + '"');  
  console.log('   Date Value:', '"' + dateValue + '"');
  console.log('   Start Time:', '"' + startTime + '"');
  console.log('   End Time:', '"' + endTime + '"');
  
  // Test validation logic
  const hasEmployee = !!employeeName;
  const hasStore = !!storeInfo;
  const hasDate = !!dateValue;
  const hasTimeSlot = !!(startTime && endTime);
  
  console.log('\n✅ Validation Check:');
  console.log('   Has Employee:', hasEmployee);
  console.log('   Has Store:', hasStore);
  console.log('   Has Date:', hasDate);
  console.log('   Has Time Slot:', hasTimeSlot);
  console.log('   Would Pass Validation:', hasEmployee && hasStore && hasDate && hasTimeSlot);
}