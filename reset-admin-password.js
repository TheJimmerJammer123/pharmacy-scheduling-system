const bcrypt = require('bcryptjs');
const db = require('./services/databaseService');

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password to "admin"...');
    
    // Hash the password "admin"
    const passwordHash = await bcrypt.hash('admin', 12);
    console.log('✅ Password hashed');
    
    // Update the admin user
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE username = $2 RETURNING username',
      [passwordHash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully');
      console.log('   Username: admin');
      console.log('   Password: admin');
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Failed to reset admin password:', error.message);
  }
}

resetAdminPassword()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });