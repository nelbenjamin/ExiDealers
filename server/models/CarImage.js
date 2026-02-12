const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CarImage = sequelize.define('CarImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cars',
      key: 'id'
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'car_images',
  timestamps: true
});

module.exports = CarImage;