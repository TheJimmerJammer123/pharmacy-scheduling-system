const xlsx = require('xlsx');
const path = require('path');

const excelPath = "/app/shift-detail.xlsx";

console.log('🔍 EXCEL FILE ANALYSIS - ULTRATHINK MODE');
console.log('=' .repeat(50));
console.log(`File: ${path.basename(excelPath)}`);
console.log('');

try {
  // Read the workbook
  const workbook = xlsx.readFile(excelPath);
  
  console.log('📊 WORKBOOK STRUCTURE:');
  console.log(`Total Sheets: ${workbook.SheetNames.length}`);
  console.log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);
  console.log('');
  
  // Analyze each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`📋 SHEET ${index + 1}: "${sheetName}"`);
    console.log('-'.repeat(40));
    
    const worksheet = workbook.Sheets[sheetName];
    const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    
    console.log(`Range: ${worksheet['!ref'] || 'Empty'}`);
    console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);
    
    // Get first few rows to understand structure
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '', 
      range: `A1:${xlsx.utils.encode_col(range.e.c)}10` // First 10 rows
    });
    
    if (jsonData.length > 0) {
      console.log('\n📝 HEADER ROW:');
      console.log(JSON.stringify(jsonData[0], null, 2));
      
      if (jsonData.length > 1) {
        console.log('\n📋 SAMPLE DATA (First 3 rows):');
        jsonData.slice(1, 4).forEach((row, idx) => {
          console.log(`Row ${idx + 2}:`, JSON.stringify(row, null, 2));
        });
      }
      
      // Analyze data types and patterns
      if (jsonData.length > 1) {
        console.log('\n🔍 COLUMN ANALYSIS:');
        const headers = jsonData[0];
        const sampleData = jsonData.slice(1, Math.min(20, jsonData.length)); // Sample up to 20 rows
        
        headers.forEach((header, colIndex) => {
          if (header && header.toString().trim()) {
            const columnData = sampleData.map(row => row[colIndex]).filter(val => val !== '' && val != null);
            const uniqueValues = [...new Set(columnData)];
            
            console.log(`  Column ${colIndex + 1}: "${header}"`);
            console.log(`    Non-empty values: ${columnData.length}`);
            console.log(`    Unique values: ${uniqueValues.length}`);
            console.log(`    Sample values: ${uniqueValues.slice(0, 3).map(v => JSON.stringify(v)).join(', ')}`);
            
            // Detect data types
            const types = new Set(columnData.map(val => typeof val));
            console.log(`    Data types: ${Array.from(types).join(', ')}`);
            
            // Check for date patterns
            if (typeof columnData[0] === 'string') {
              const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2}-\d{2,4}/;
              const timePattern = /\d{1,2}:\d{2}|\d{1,2}:\d{2}:\d{2}|AM|PM/i;
              const hasDate = columnData.some(val => datePattern.test(val.toString()));
              const hasTime = columnData.some(val => timePattern.test(val.toString()));
              
              if (hasDate) console.log(`    Contains dates: Yes`);
              if (hasTime) console.log(`    Contains times: Yes`);
            }
            console.log('');
          }
        });
      }
      
      // Get total row count
      const allData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`📊 TOTAL DATA ROWS: ${allData.length - 1} (excluding header)`);
    } else {
      console.log('⚠️ No data found in sheet');
    }
    
    console.log('');
  });
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  process.exit(1);
}