const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cars',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.ENUM('view', 'favorite_add', 'favorite_remove', 'save_add', 'save_remove', 'price_alert_set', 'enquiry_sent'),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'user_activities',
  timestamps: true
});

module.exports = UserActivity;