#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test the Excel import process
async function testExcelImport() {
  console.log('🧪 Testing Excel Import Process...\n');

  try {
    // Read the Excel file
    const excelFile = 'Shift Detail(7-1-25 to 7-20-25) 2025-07-20T09.04.47.xlsx';
    
    if (!fs.existsSync(excelFile)) {
      console.error('❌ Excel file not found:', excelFile);
      return;
    }

    console.log('✅ Excel file found:', excelFile);
    console.log('📊 File size:', (fs.statSync(excelFile).size / 1024).toFixed(2), 'KB');

    // Convert to base64 for testing
    const fileBuffer = fs.readFileSync(excelFile);
    const base64Content = fileBuffer.toString('base64');

    console.log('\n📋 Preparing import data...');
    
    // Create test import request
    const importRequest = {
      import_id: 'test-import-' + Date.now(),
      file_name: excelFile,
      file_type: 'excel',
      content: base64Content
    };

    console.log('✅ Import request prepared');
    console.log('📝 Import ID:', importRequest.import_id);

    // Test the import via our API
    console.log('\n🚀 Testing import via API...');
    
    const response = await fetch('http://localhost:8002/functions/v1/process-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXJtLXNjaGVkdWxpbmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NDMxNjQyOSwiZXhwIjoxNzg1ODUyNDI5fQ.rFYSJjoH9jLAT-ifkQIprH5ORmpFQKkA27dohsf15NA',
        'Authorization': `Bearer ${process.env.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXJtLXNjaGVkdWxpbmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NDMxNjQyOSwiZXhwIjoxNzg1ODUyNDI5fQ.rFYSJjoH9jLAT-ifkQIprH5ORmpFQKkA27dohsf15NA'}`
      },
      body: JSON.stringify(importRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ Import completed successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 Import Summary:');
      console.log(`   📈 Total Records: ${result.results.total_records}`);
      console.log(`   👥 Employees: ${result.results.summary.employees_imported}`);
      console.log(`   🏪 Stores: ${result.results.summary.stores_imported}`);
      console.log(`   📅 Schedules: ${result.results.summary.schedules_imported}`);
      
      if (result.results.summary.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        result.results.summary.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Import test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testExcelImport().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
}); 