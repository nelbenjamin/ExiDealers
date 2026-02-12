const { Sequelize } = require('sequelize');
require('dotenv').config();

// MySQL configuration for Hostinger
const sequelize = new Sequelize(
  process.env.DB_NAME || 'exidealers', // Hostinger database names usually start with uXXXXX_
  process.env.DB_USER || 'root',      // Hostinger usernames usually start with uXXXXX_
  process.env.DB_PASSWORD || 'nelly19801',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Disable SQL logging in production
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      // Hostinger specific options
      connectTimeout: 60000,
      // Add SSL if required by Hostinger
      // ssl: {
      //   rejectUnauthorized: false
      // }
    },
    timezone: '+00:00', // UTC timezone
    // Pool configuration optimized for hosting
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,    // Increased for slower hosting connections
      idle: 10000
    },
    // Retry configuration for better stability
    retry: {
      max: 3,
      timeout: 30000
    }
  }
);

// Test the connection with better error handling
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Optional: Log database info (remove in production)
    const [results] = await sequelize.query("SELECT DATABASE() as db");
    console.log(`📊 Connected to database: ${results[0].db}`);
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log('💡 Check your .env file configuration:');
    console.log('   DB_HOST:', process.env.DB_HOST);
    console.log('   DB_NAME:', process.env.DB_NAME);
    console.log('   DB_USER:', process.env.DB_USER);
    console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'Not set');
  }
}

testConnection();

module.exports = sequelize;