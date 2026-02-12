const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CarEnquiry = sequelize.define('CarEnquiry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  carName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fullName: {
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
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'car_enquiries',
  timestamps: true
});

module.exports = CarEnquiry;