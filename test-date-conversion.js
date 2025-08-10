// Test Excel date conversion
console.log('📅 Testing Excel date conversion...');

const excelService = require('./services/excelIngestionService');

// Test the normalizeDate function with our sample date
const testDateValue = 45839;
console.log('Excel serial date:', testDateValue);

try {
  const convertedDate = excelService.normalizeDate(testDateValue);
  console.log('Converted date:', convertedDate);
  
  if (!convertedDate) {
    console.log('❌ Date conversion failed - this explains why records are skipped!');
  } else {
    console.log('✅ Date conversion successful');
  }
} catch (error) {
  console.error('❌ Date conversion error:', error.message);
}

// Let's also test a string version
try {
  const stringDateResult = excelService.normalizeDate('45839');
  console.log('String date conversion:', stringDateResult);
} catch (error) {
  console.error('String date error:', error.message);
}