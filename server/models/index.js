const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Import models
const Car = require('./Car');
const CarImage = require('./CarImage');
const PriceAlert = require('./PriceAlert');
const Newsletter = require('./Newsletter');
const Contact = require('./Contact');
const CarEnquiry = require('./CarEnquiry');

// IMPORTANT: Import user models directly (don't use try/catch - we want them to exist)
const User = require('./User');
const UserFavorite = require('./UserFavorite');
const UserSaved = require('./UserSaved'); // Note: I'm using UserSaved (not UserSavedCar)

// Define all associations in one place - CLEAN AND ORGANIZED

// ============= CAR ASSOCIATIONS =============
Car.hasMany(CarImage, { 
  foreignKey: 'carId', 
  as: 'images',
  onDelete: 'CASCADE'
});
CarImage.belongsTo(Car, { 
  foreignKey: 'carId', 
  as: 'car'
});

// ============= USER ASSOCIATIONS =============

// User -> Favorites (One-to-Many)
User.hasMany(UserFavorite, {
  foreignKey: 'userId',
  as: 'favorites',
  onDelete: 'CASCADE'
});
UserFavorite.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Saved Cars (One-to-Many)
User.hasMany(UserSaved, {
  foreignKey: 'userId',
  as: 'savedCars',
  onDelete: 'CASCADE'
});
UserSaved.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Price Alerts (One-to-Many)
User.hasMany(PriceAlert, {
  foreignKey: 'userId',
  as: 'priceAlerts',
  onDelete: 'SET NULL'
});
PriceAlert.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ============= CAR FAVORITE/SAVED ASSOCIATIONS =============

// Car -> Favorites (One-to-Many)
Car.hasMany(UserFavorite, {
  foreignKey: 'carId',
  as: 'favoritedBy',
  onDelete: 'CASCADE'
});
UserFavorite.belongsTo(Car, {
  foreignKey: 'carId',
  as: 'car'
});

// Car -> Saved (One-to-Many)
Car.hasMany(UserSaved, {
  foreignKey: 'carId',
  as: 'savedBy',
  onDelete: 'CASCADE'
});
UserSaved.belongsTo(Car, {
  foreignKey: 'carId',
  as: 'car'
});

// ============= PRICE ALERT ASSOCIATIONS =============
PriceAlert.belongsTo(Car, {
  foreignKey: 'carId',
  as: 'car'
});

// ============= SYNC DATABASE FUNCTION =============
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Use { alter: true } to add new columns to existing tables
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully. New columns added.');
    
    // Log all synced tables
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('📊 Active tables:', results.map(r => Object.values(r)[0]).join(', '));
    
  } catch (error) {
    console.error('❌ Unable to sync database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  syncDatabase,
  Car,
  CarImage,
  PriceAlert,
  Newsletter,
  Contact,
  CarEnquiry,
  User,
  UserFavorite,
  UserSaved
};