const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserFavorite = sequelize.define('UserFavorite', {
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
    allowNull: false,
    references: {
      model: 'cars',
      key: 'id'
    }
  }
}, {
  tableName: 'user_favorites',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'carId']
    }
  ]
});

module.exports = UserFavorite;