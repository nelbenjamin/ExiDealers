const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Dealer = sequelize.define('Dealer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessName: {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  whatsapp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  businessRegistration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalListings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxListings: {
    type: DataTypes.INTEGER,
    defaultValue: 50 // Free tier limit
  },
  subscriptionTier: {
    type: DataTypes.ENUM('free', 'basic', 'premium'),
    defaultValue: 'free'
  }
}, {
  tableName: 'dealers',
  timestamps: true,
  hooks: {
    beforeCreate: async (dealer) => {
      if (dealer.password) {
        const salt = await bcrypt.genSalt(10);
        dealer.password = await bcrypt.hash(dealer.password, salt);
      }
    },
    beforeUpdate: async (dealer) => {
      if (dealer.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        dealer.password = await bcrypt.hash(dealer.password, salt);
      }
    }
  }
});

// Instance method to check password
Dealer.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Dealer;