const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PriceAlert = sequelize.define('PriceAlert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  carMake: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carModel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  carPrice: {
    type: DataTypes.STRING,
    allowNull: true
  },
  carMileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  carLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  similarCars: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'price_alerts',
  timestamps: true
});

module.exports = PriceAlert;