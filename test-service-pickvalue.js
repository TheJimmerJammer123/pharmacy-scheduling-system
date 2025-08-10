const excelService = require('./services/excelIngestionService');
const xlsx = require('xlsx');

console.log('🔧 Testing ExcelIngestionService pickValue function');

// Read Excel and get first data row
const workbook = xlsx.readFile('/app/shift-detail.xlsx');
const worksheet = workbook.Sheets['Shift Detail'];
const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
const headerRow = rows[0];
const sampleRow = rows[1];

// Create index map using service method
const indexMap = excelService.extractHeaderIndexMap(headerRow);

console.log('🗂️ Service Index Map:');
console.log('   Keys found:', Object.keys(indexMap).length);
console.log('   Sample keys:', Object.keys(indexMap).slice(0, 5));

// Test key arrays from service
const employeeKeys = ['employee id', 'employee', 'employee name', 'name', 'last name', 'first name'];
const storeKeys = ['store number', 'store', 'site', 'location number', 'site number', 'scheduled site'];
const dateKeys = ['date', 'shift date', 'work date', 'scheduled date'];
const shiftStartKeys = ['shift start', 'start time', 'start'];
const shiftEndKeys = ['shift end', 'end time', 'end'];

console.log('\n🔍 Testing pickValue with service keys:');

const firstName = excelService.pickValue(sampleRow, indexMap, ['first name']);
const lastName = excelService.pickValue(sampleRow, indexMap, ['last name']);
const rawEmployeeName = excelService.pickValue(sampleRow, indexMap, employeeKeys);
const employee_name = rawEmployeeName || [firstName, lastName].filter(Boolean).join(' ').trim();

const storeNumberStr = excelService.pickValue(sampleRow, indexMap, storeKeys);
const dateStr = excelService.pickValue(sampleRow, indexMap, dateKeys);
const start = excelService.pickValue(sampleRow, indexMap, shiftStartKeys);
const end = excelService.pickValue(sampleRow, indexMap, shiftEndKeys);

console.log('   Raw Employee Name:', '"' + (rawEmployeeName || 'undefined') + '"');
console.log('   First Name:', '"' + (firstName || 'undefined') + '"');
console.log('   Last Name:', '"' + (lastName || 'undefined') + '"');
console.log('   Final Employee Name:', '"' + employee_name + '"');
console.log('   Store Number Str:', '"' + (storeNumberStr || 'undefined') + '"');
console.log('   Date Str:', '"' + (dateStr || 'undefined') + '"');
console.log('   Start Time:', '"' + (start || 'undefined') + '"');
console.log('   End Time:', '"' + (end || 'undefined') + '"');

console.log('\n✅ Service Validation Check:');
console.log('   Has employee_name:', !!employee_name);
console.log('   Has storeNumberStr:', !!storeNumberStr);
console.log('   Has dateStr:', !!dateStr);
console.log('   Has start AND end:', !!(start && end));
console.log('   Would pass service validation:', !!(employee_name && storeNumberStr && dateStr && (start && end)));