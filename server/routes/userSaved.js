const express = require('express');
const router = express.Router();
const { UserSaved, Car, CarImage } = require('../models');
const { requireAuth } = require('./auth');

// Get user's saved cars
router.get('/', requireAuth, async (req, res) => {
  try {
    const saved = await UserSaved.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Car,
        as: 'car', // IMPORTANT: Must match the alias in your association
        include: [{
          model: CarImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'order']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Extract the Car objects from the saved items
    const cars = saved.map(s => s.car).filter(car => car !== null);
    res.json(cars);
  } catch (error) {
    console.error('Error fetching saved cars:', error);
    res.status(500).json({ error: 'Failed to fetch saved cars: ' + error.message });
  }
});

// Add to saved
router.post('/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    
    const [saved, created] = await UserSaved.findOrCreate({
      where: {
        userId: req.user.id,
        carId: carId
      }
    });
    
    res.json({ success: true, added: created });
  } catch (error) {
    console.error('Error saving car:', error);
    res.status(500).json({ error: 'Failed to save car: ' + error.message });
  }
});

// Remove from saved
router.delete('/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    
    const deleted = await UserSaved.destroy({
      where: {
        userId: req.user.id,
        carId: carId
      }
    });
    
    res.json({ success: true, removed: deleted > 0 });
  } catch (error) {
    console.error('Error removing saved car:', error);
    res.status(500).json({ error: 'Failed to remove saved car: ' + error.message });
  }
});

// Check if car is saved
router.get('/check/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    
    const saved = await UserSaved.findOne({
      where: {
        userId: req.user.id,
        carId: carId
      }
    });
    
    res.json({ isSaved: !!saved });
  } catch (error) {
    console.error('Error checking saved car:', error);
    res.status(500).json({ error: 'Failed to check saved car: ' + error.message });
  }
});

module.exports = router;