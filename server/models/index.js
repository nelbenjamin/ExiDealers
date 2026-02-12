const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Import models
const Car = require('./Car');
const CarImage = require('./CarImage');
const PriceAlert = require('./PriceAlert');
const Newsletter = require('./Newsletter');
const Contact = require('./Contact');
const CarEnquiry = require('./CarEnquiry');

// IMPORTANT: Check if User model exists, if not we'll create it
let User, UserFavorite, UserSavedCar;

try {
  User = require('./User');
  console.log('✅ User model loaded successfully');
} catch (error) {
  console.log('⚠️ User model not found, creating placeholder...');
  // Create a simple User model for now
  const { DataTypes } = require('sequelize');
  User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });
}

try {
  UserFavorite = require('./UserFavorite');
  console.log('✅ UserFavorite model loaded successfully');
} catch (error) {
  console.log('⚠️ UserFavorite model not found, creating placeholder...');
  const { DataTypes } = require('sequelize');
  UserFavorite = sequelize.define('UserFavorite', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    carId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'user_favorites',
    timestamps: true
  });
}

try {
  UserSavedCar = require('./UserSavedCar');
  console.log('✅ UserSavedCar model loaded successfully');
} catch (error) {
  console.log('⚠️ UserSavedCar model not found, creating placeholder...');
  const { DataTypes } = require('sequelize');
  UserSavedCar = sequelize.define('UserSavedCar', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    carId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'user_saved_cars',
    timestamps: true
  });
}

// Define associations for Car
Car.hasMany(CarImage, { 
  foreignKey: 'carId', 
  as: 'images',
  onDelete: 'CASCADE'
});
CarImage.belongsTo(Car, { 
  foreignKey: 'carId', 
  as: 'car'
});

// Define associations for User (only if models exist)
if (User && UserFavorite) {
  User.hasMany(UserFavorite, {
    foreignKey: 'userId',
    as: 'favorites',
    onDelete: 'CASCADE'
  });
  UserFavorite.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  UserFavorite.belongsTo(Car, {
    foreignKey: 'carId',
    as: 'car'
  });
}

if (User && UserSavedCar) {
  User.hasMany(UserSavedCar, {
    foreignKey: 'userId',
    as: 'savedCars',
    onDelete: 'CASCADE'
  });
  UserSavedCar.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  UserSavedCar.belongsTo(Car, {
    foreignKey: 'carId',
    as: 'car'
  });
}

if (Car && UserFavorite) {
  Car.hasMany(UserFavorite, {
    foreignKey: 'carId',
    as: 'favoritedBy'
  });
}

if (Car && UserSavedCar) {
  Car.hasMany(UserSavedCar, {
    foreignKey: 'carId',
    as: 'savedBy'
  });
}

// SINGLE sync database function - NO DUPLICATES
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Use { alter: true } to add new columns to existing tables
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully. New columns added.');
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
  UserSavedCar
};