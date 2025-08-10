const db = require('./services/databaseService');

console.log('🔬 TESTING DIRECT UPSERT OPERATION');
console.log('==================================');

async function testDirectUpsert() {
  try {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Test data from our debugging (Row 1)
      const testData = {
        store_number: 79,
        date: '2025-07-01',
        employee_name: 'Viktoriya Dorosh',
        shift_time: '6:00am - 2:30pm',
        notes: null,
        employee_id: null,
        region: 'Northeast',
        role: 'Pharmacist',
        employee_type: 'Full-time',
        scheduled_hours: 8.5,
        start_time: '6:00am',
        end_time: '2:30pm',
        published: true
      };

      console.log('📊 Test data prepared:', testData);

      // Execute the exact upsert query from the service
      const query = `
        INSERT INTO schedule_entries (
          store_number, date, employee_name, shift_time, notes,
          employee_id, region, role, employee_type, scheduled_hours,
          start_time, end_time, published
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (store_number, date, employee_name, shift_time)
        DO UPDATE SET 
          notes = EXCLUDED.notes,
          employee_id = EXCLUDED.employee_id,
          region = EXCLUDED.region,
          role = EXCLUDED.role,
          employee_type = EXCLUDED.employee_type,
          scheduled_hours = EXCLUDED.scheduled_hours,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          published = EXCLUDED.published,
          updated_at = NOW()
        RETURNING *
      `;

      const params = [
        testData.store_number, 
        testData.date, 
        testData.employee_name, 
        testData.shift_time, 
        testData.notes,
        testData.employee_id, 
        testData.region, 
        testData.role, 
        testData.employee_type, 
        testData.scheduled_hours, 
        testData.start_time, 
        testData.end_time, 
        testData.published
      ];

      console.log('🔧 Executing upsert query with parameters:', params);

      const result = await client.query(query, params);
      
      console.log('✅ Upsert successful!');
      console.log('   Rows affected:', result.rowCount);
      console.log('   Returned data:', result.rows[0]);

      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Upsert failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error detail:', error.detail);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('💥 Database connection failed:', error.message);
    throw error;
  }
}

// Run test
testDirectUpsert()
  .then(() => {
    console.log('🎉 Direct upsert test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });