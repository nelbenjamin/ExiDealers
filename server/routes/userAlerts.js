const express = require('express');
const router = express.Router();
const { PriceAlert, Car } = require('../models');
const { requireAuth } = require('./auth');
const { logActivity } = require('./userActivity');

// Get user's price alerts
router.get('/', requireAuth, async (req, res) => {
  try {
    const alerts = await PriceAlert.findAll({
      where: { 
        userId: req.user.id,
        isActive: true
      },
      include: [{
        model: Car,
        as: 'car',
        attributes: ['id', 'make', 'model', 'year', 'price', 'mileage', 'location']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 Found ${alerts.length} alerts for user ${req.user.id}`);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    res.status(500).json({ error: 'Failed to fetch price alerts: ' + error.message });
  }
});

// Create price alert for logged in user
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      carId, 
      carMake, 
      carModel, 
      carYear, 
      carPrice, 
      carMileage, 
      carLocation, 
      similarCars 
    } = req.body;
    
    const user = req.user;
    
    // Check if alert already exists
    const existingAlert = await PriceAlert.findOne({
      where: { 
        userId: user.id, 
        carId, 
        isActive: true 
      }
    });
    
    if (existingAlert) {
      return res.json({ 
        success: true, 
        message: 'Alert already exists', 
        alert: existingAlert 
      });
    }
    
    // Create alert with user's information
    const newAlert = await PriceAlert.create({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      carId,
      carMake,
      carModel,
      carYear,
      carPrice,
      carMileage,
      carLocation,
      similarCars: similarCars || false,
      isActive: true
    });
    
    console.log(`✅ Price alert created for user ${user.id} on car ${carId}`);
    
    res.json({ 
      success: true, 
      message: 'Price alert created successfully', 
      alert: newAlert 
    });
  } catch (error) {
    console.error('Error creating price alert:', error);
    res.status(500).json({ error: 'Failed to create price alert: ' + error.message });
  }
});

// Deactivate alert
router.delete('/:alertId', requireAuth, async (req, res) => {
  try {
    const alert = await PriceAlert.findOne({
      where: { 
        id: req.params.alertId,
        userId: req.user.id
      }
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.isActive = false;
    await alert.save();
    
    console.log(`✅ Alert ${req.params.alertId} deactivated for user ${req.user.id}`);
    res.json({ success: true, message: 'Alert deactivated' });
  } catch (error) {
    console.error('Error deactivating alert:', error);
    res.status(500).json({ error: 'Failed to deactivate alert: ' + error.message });
  }
});

module.exports = router;