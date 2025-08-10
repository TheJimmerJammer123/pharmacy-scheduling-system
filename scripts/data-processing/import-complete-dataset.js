#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DATA_FILE = '/home/jimmerjammer/pharm-project/processed_pharmacy_data.json';
const BATCH_SIZE = 1000;

// Database connection via docker
const runSQL = (sql, description) => {
  console.log(`\nProcessing: ${description}...`);
  try {
    const result = execSync(`docker exec pharm-db psql -U postgres -d pharmacy -c "${sql.replace(/"/g, '\\"')}"`, 
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    console.log(`Completed: ${description}`);
    return result;
  } catch (error) {
    console.error(`Failed: ${description}:`, error.message);
    throw error;
  }
};

// Load and parse data
const loadData = () => {
  console.log('Loading processed data...');
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(rawData);
  
  console.log(`Data loaded:`);
  console.log(`   Schedules: ${data.schedules?.length || 0}`);
  console.log(`   Employees: ${data.employees?.length || 0}`);
  console.log(`   Stores: ${data.stores?.length || 0}`);
  
  return data;
};

// Parse shift time into start_time and end_time
const parseShiftTime = (shiftTime) => {
  if (!shiftTime) return { start_time: null, end_time: null };
  
  const timeMatch = shiftTime.match(/(\d{1,2}:\d{2}(?:am|pm))\s*-\s*(\d{1,2}:\d{2}(?:am|pm))/i);
  if (!timeMatch) return { start_time: null, end_time: null };
  
  const [, startStr, endStr] = timeMatch;
  
  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (timeStr) => {
    const [time, period] = timeStr.toLowerCase().split(/(?=am|pm)/);
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };
  
  return {
    start_time: convertTo24Hour(startStr),
    end_time: convertTo24Hour(endStr)
  };
};

// Extract employee ID from notes
const extractEmployeeId = (notes) => {
  if (!notes) return null;
  const match = notes.match(/Employee ID: (\d+)/);
  return match ? match[1] : null;
};

// Extract role from notes
const extractRole = (notes) => {
  if (!notes) return null;
  const match = notes.match(/Role: ([^,]+)/);
  return match ? match[1].trim() : null;
};

// Clear existing data
const clearExistingData = () => {
  console.log('\nClearing existing sample data...');
  
  // Clear in order due to foreign key constraints
  runSQL('DELETE FROM store_schedules;', 'Clearing schedule records');
  runSQL('DELETE FROM contacts;', 'Clearing all contacts');
  runSQL('DELETE FROM stores;', 'Clearing all stores');
  
  console.log('Tables cleared (using UUIDs, no sequences to reset)');
};

// Import stores
const importStores = (stores) => {
  console.log('\nImporting stores...');
  
  const storeValues = stores.map(store => {
    const storeName = store.store_name || `Store ${store.store_number}`;
    const city = store.store_name ? store.store_name.split(' - ')[1]?.split(' (')[0] || 'Unknown' : 'Unknown';
    const state = 'NY'; // Assuming NY/VT based on store names
    const address = `${store.store_number} Main St`; // Generic address
    const zipCode = '12345'; // Generic zip
    const phone = `315-555-${store.store_number.toString().padStart(4, '0')}`; // Generated phone
    
    return `(${store.store_number}, '${address}', '${city.replace(/'/g, "''")}', '${state}', '${zipCode}', '${phone}', TRUE, NOW(), NOW())`;
  }).join(',\n  ');
  
  const sql = `
    INSERT INTO stores (store_number, address, city, state, zip_code, phone, is_active, created_at, updated_at)
    VALUES ${storeValues}
    ON CONFLICT (store_number) DO UPDATE SET
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      zip_code = EXCLUDED.zip_code,
      phone = EXCLUDED.phone,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  `;
  
  runSQL(sql, `Importing ${stores.length} stores`);
};

// Import employees in batches
const importEmployees = (employees) => {
  console.log('\nImporting employees...');
  
  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(employees.length / BATCH_SIZE);
    
    console.log(`   Processing batch ${batchNumber}/${totalBatches} (${batch.length} employees)`);
    
    const employeeValues = batch.map(employee => {
      const employeeId = extractEmployeeId(employee.notes);
      const name = employee.name.replace(/'/g, "''");
      const phone = employee.phone ? `'${employee.phone.replace(/'/g, "''")}'` : `'${employeeId || Math.random().toString().substr(2, 10)}'`; // Use employee ID as phone if no phone
      const email = employee.email ? `'${employee.email.replace(/'/g, "''")}'` : 'NULL';
      const status = employee.status || 'active';
      const priority = employee.priority || 'medium';
      const notes = employee.notes ? `'${employee.notes.replace(/'/g, "''")}'` : 'NULL';
      
      return `('${name}', ${phone}, ${email}, '${status}', '${priority}', ${notes}, NOW(), NOW())`;
    }).join(',\n    ');
    
    const sql = `
      INSERT INTO contacts (name, phone, email, status, priority, notes, created_at, updated_at)
      VALUES ${employeeValues}
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        notes = EXCLUDED.notes,
        updated_at = NOW();
    `;
    
    runSQL(sql, `Importing employee batch ${batchNumber}/${totalBatches}`);
  }
};

// Import schedules in batches
const importSchedules = (schedules) => {
  console.log('\nImporting schedules...');
  
  for (let i = 0; i < schedules.length; i += BATCH_SIZE) {
    const batch = schedules.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(schedules.length / BATCH_SIZE);
    
    console.log(`   Processing batch ${batchNumber}/${totalBatches} (${batch.length} schedules)`);
    
    const scheduleValues = batch.map(schedule => {
      const employeeName = schedule.employee_name.replace(/'/g, "''");
      const role = schedule.role || 'Unknown';
      const employeeType = schedule.employee_type || 'Unknown';
      const notes = schedule.notes ? `'${schedule.notes.replace(/'/g, "''")}'` : 'NULL';
      
      return `(${schedule.store_number}, '${schedule.date}', '${employeeName}', '${schedule.employee_id}', '${role}', '${employeeType}', '${schedule.shift_time || ''}', ${schedule.scheduled_hours || 0}, ${notes}, NOW(), NOW())`;
    }).join(',\n    ');
    
    const sql = `
      INSERT INTO store_schedules (store_number, date, employee_name, employee_id, role, employee_type, shift_time, scheduled_hours, notes, created_at, updated_at)
      VALUES ${scheduleValues};
    `;
    
    runSQL(sql, `Importing schedule batch ${batchNumber}/${totalBatches}`);
  }
};

// Verify import
const verifyImport = () => {
  console.log('\nVerifying import...');
  
  const storeCount = runSQL('SELECT COUNT(*) FROM stores;', 'Counting stores');
  const employeeCount = runSQL('SELECT COUNT(*) FROM contacts;', 'Counting employees');
  const scheduleCount = runSQL('SELECT COUNT(*) FROM store_schedules;', 'Counting schedules');
  
  console.log('\nImport Summary:');
  console.log(`   Stores: ${storeCount.match(/(\d+)/)?.[1] || 'Unknown'}`);
  console.log(`   Employees: ${employeeCount.match(/(\d+)/)?.[1] || 'Unknown'}`);
  console.log(`   Schedules: ${scheduleCount.match(/(\d+)/)?.[1] || 'Unknown'}`);
  
  // Show some sample data
  console.log('\nSample Data:');
  
  const sampleStores = runSQL('SELECT store_number, city, state FROM stores LIMIT 5;', 'Getting sample stores');
  console.log('Sample Stores:');
  console.log(sampleStores);
  
  const sampleEmployees = runSQL('SELECT name, status FROM contacts LIMIT 5;', 'Getting sample employees');
  console.log('Sample Employees:');
  console.log(sampleEmployees);
  
  const sampleSchedules = runSQL('SELECT store_number, date, employee_name, role, shift_time FROM store_schedules LIMIT 5;', 'Getting sample schedules');
  console.log('Sample Schedules:');
  console.log(sampleSchedules);
};

// Main execution
const main = async () => {
  try {
    console.log('Starting complete dataset import...');
    
    // Load data
    const data = loadData();
    
    if (!data.schedules || !data.employees || !data.stores) {
      throw new Error('Required data sections missing from processed file');
    }
    
    // Clear existing data
    clearExistingData();
    
    // Import data in order
    importStores(data.stores);
    importEmployees(data.employees);
    importSchedules(data.schedules);
    
    // Verify import
    verifyImport();
    
    console.log('\nComplete dataset import finished successfully!');
    console.log('\nYour pharmacy database now contains the full dataset:');
    console.log(`   ${data.stores.length} stores`);
    console.log(`   ${data.employees.length} employees`);
    console.log(`   ${data.schedules.length} schedule records`);
    
  } catch (error) {
    console.error('\nImport failed:', error.message);
    process.exit(1);
  }
};

// Run the import
main();
