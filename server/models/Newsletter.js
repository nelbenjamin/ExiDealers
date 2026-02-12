const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Newsletter = sequelize.define('Newsletter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  subscribedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'newsletter_subscribers',
  timestamps: false
});

module.exports = Newsletter;