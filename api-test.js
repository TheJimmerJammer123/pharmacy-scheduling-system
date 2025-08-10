const excelIngestionService = require('./backend/services/excelIngestionService');
const fs = require('fs');

// Simulate the API request body processing
async function testApiSimulation() {
  console.log('🧪 Testing API simulation...');
  
  try {
    // Read the same payload file we created
    const mockRequestBody = fs.readFileSync('/tmp/direct-payload.json', 'utf8');
    const parsedBody = JSON.parse(mockRequestBody);
    
    console.log('📋 Parsed request body keys:', Object.keys(parsedBody));
    console.log('📋 Content length:', parsedBody.content ? parsedBody.content.length : 'undefined');
    
    const { import_id, file_name, file_type, content } = parsedBody;
    
    if (!content || typeof content !== 'string') {
      console.error('❌ Content validation failed:', typeof content);
      return;
    }
    
    console.log('✅ Content validation passed');
    
    const importId = import_id || `import-${Date.now()}`;
    
    // This is exactly what the API endpoint does
    const results = await excelIngestionService.processExcel({
      importId,
      fileName: file_name || 'upload.xlsx',
      base64Content: content,
    });
    
    console.log('✅ API simulation successful!');
    console.log('📊 Results:', JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ API simulation failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testApiSimulation();