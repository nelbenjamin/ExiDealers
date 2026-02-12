const sequelize = require('./config/db');

// Import all your models
const Car = require('./models/Car');
const CarImage = require('./models/CarImage');
const PriceAlert = require('./models/PriceAlert');
const Contact = require('./models/Contact');
const Newsletter = require('./models/Newsletter');

async function setupDatabase() {
  try {
    console.log('🔧 Starting database setup...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models - use { force: true } only in development to reset tables
    // Use { alter: true } in production to safely update tables
    const syncOptions = { 
      force: process.argv.includes('--reset') // Only reset if --reset flag is passed
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Database tables synchronized successfully');

    // Add some sample data if tables were reset
    if (syncOptions.force) {
      console.log('📝 Adding sample data...');
      // You can add sample data here if needed
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Your database is ready');
    console.log('   2. Start your server: npm start');
    console.log('   3. Access your admin dashboard');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;