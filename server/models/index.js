const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Import models
const Car = require('./Car');
const CarImage = require('./CarImage');
const PriceAlert = require('./PriceAlert');
const Newsletter = require('./Newsletter');
const Contact = require('./Contact');
const CarEnquiry = require('./CarEnquiry');
const UserActivity = require('./UserActivity');

// IMPORTANT: Import user models directly
const User = require('./User');
const UserFavorite = require('./UserFavorite');
const UserSaved = require('./UserSaved');

// Define all associations in one place

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

// User -> Favorites
User.hasMany(UserFavorite, {
  foreignKey: 'userId',
  as: 'favorites',
  onDelete: 'CASCADE'
});
UserFavorite.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Saved Cars
User.hasMany(UserSaved, {
  foreignKey: 'userId',
  as: 'savedCars',
  onDelete: 'CASCADE'
});
UserSaved.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Price Alerts
User.hasMany(PriceAlert, {
  foreignKey: 'userId',
  as: 'priceAlerts',
  onDelete: 'SET NULL'
});
PriceAlert.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Activities
User.hasMany(UserActivity, {
  foreignKey: 'userId',
  as: 'activities',
  onDelete: 'CASCADE'
});
UserActivity.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ============= CAR FAVORITE/SAVED/ACTIVITY ASSOCIATIONS =============

// Car -> Favorites
Car.hasMany(UserFavorite, {
  foreignKey: 'carId',
  as: 'favoritedBy',
  onDelete: 'CASCADE'
});
UserFavorite.belongsTo(Car, {
  foreignKey: 'carId',
  as: 'car'
});

// Car -> Saved
Car.hasMany(UserSaved, {
  foreignKey: 'carId',
  as: 'savedBy',
  onDelete: 'CASCADE'
});
UserSaved.belongsTo(Car, {
  foreignKey: 'carId',
  as: 'car'
});

// Car -> Activities
Car.hasMany(UserActivity, {
  foreignKey: 'carId',
  as: 'activities',
  onDelete: 'SET NULL'
});
UserActivity.belongsTo(Car, {
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

    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully. New columns added.');
    
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
  UserActivity,
  User,
  UserFavorite,
  UserSaved
};