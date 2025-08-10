const fs = require('fs');
const db = require('./backend/services/databaseService');

async function importKinneyStores() {
  console.log('🏪 Importing Kinney stores data...');
  
  try {
    const storesData = JSON.parse(fs.readFileSync('kinney_stores_complete_final.json', 'utf8'));
    
    console.log(`📋 Found ${storesData.length} stores to import`);
    
    // Import each store
    let imported = 0;
    let updated = 0;
    
    for (const store of storesData) {
      const query = `
        INSERT INTO stores (store_number, address, city, state, zip_code, phone, pharmacy_hours, store_hours, latitude, longitude, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (store_number) 
        DO UPDATE SET
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip_code = EXCLUDED.zip_code,
          phone = EXCLUDED.phone,
          pharmacy_hours = EXCLUDED.pharmacy_hours,
          store_hours = EXCLUDED.store_hours,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted;
      `;
      
      const params = [
        store.store_number,
        store.address,
        store.city, 
        store.state,
        store.zip_code,
        store.phone,
        store.pharmacy_hours,
        store.store_hours,
        store.latitude,
        store.longitude,
        store.is_active
      ];
      
      const result = await db.query(query, params);
      if (result.rows[0].inserted) {
        imported++;
      } else {
        updated++;
      }
    }
    
    console.log(`✅ Kinney stores import complete:`);
    console.log(`   - ${imported} new stores imported`);
    console.log(`   - ${updated} existing stores updated`);
    
    // Verify our key Excel stores are present
    const keyStores = [16, 17, 79, 87, 102];
    console.log(`\n🔍 Verifying key Excel stores:`);
    
    for (const storeNum of keyStores) {
      const result = await db.query('SELECT store_number, city, state FROM stores WHERE store_number = $1', [storeNum]);
      if (result.rows.length > 0) {
        const store = result.rows[0];
        console.log(`   ✅ Store ${storeNum}: ${store.city}, ${store.state}`);
      } else {
        console.log(`   ❌ Store ${storeNum}: NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('❌ Kinney stores import failed:', error.message);
    throw error;
  }
}

// Run import
importKinneyStores()
  .then(() => {
    console.log('🎉 Kinney stores import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Import failed:', error);
    process.exit(1);
  });