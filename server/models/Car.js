const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  make: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  preferredContact: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'email'
  },
  bodyType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transmission: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fuelType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  driveType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'cars',
  timestamps: true
});

module.exports = Car;