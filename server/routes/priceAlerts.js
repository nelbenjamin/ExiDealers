const express = require('express');
const router = express.Router();
const PriceAlert = require('../models/PriceAlert');

// Create price alert
router.post('/', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      carId, 
      carMake, 
      carModel, 
      carYear, 
      carPrice,  // Changed from currentPrice
      carMileage, 
      carLocation, 
      similarCars 
    } = req.body;
    
    // Check if alert already exists for this email and car
    const existingAlert = await PriceAlert.findOne({
      where: { email, carId, isActive: true }
    });
    
    if (existingAlert) {
      return res.json({ message: 'Alert already exists for this car' });
    }
    
    const newAlert = await PriceAlert.create({
      firstName,
      lastName,
      email,
      phone,
      carId,
      carMake,
      carModel,
      carYear,
      carPrice,  // Changed from currentPrice
      carMileage,
      carLocation,
      similarCars
    });
    
    res.json({ success: true, alert: newAlert });
  } catch (error) {
    console.error('Error creating price alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all price alerts (admin only)
router.get('/', async (req, res) => {
  try {
    const token = req.headers['admin-token'];
    if (!token || token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    const alerts = await PriceAlert.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts for user
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const alerts = await PriceAlert.findAll({
      where: { email },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await PriceAlert.findByPk(id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    await alert.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting price alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate alert
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await PriceAlert.findByPk(id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.isActive = false;
    await alert.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deactivating price alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;