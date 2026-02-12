const { sequelize, syncDatabase } = require('./models');

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  try {
    // Drop all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('✅ Database reset complete! All tables recreated.');
    
    // List all tables
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('📊 Current tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();