const express = require('express');
const router = express.Router();
const { UserFavorite, Car, CarImage } = require('../models');
const { requireAuth } = require('./auth');

// Get user's favorites
router.get('/', requireAuth, async (req, res) => {
  try {
    const favorites = await UserFavorite.findAll({
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
    
    // Extract the Car objects from the favorites
    const cars = favorites.map(fav => fav.car).filter(car => car !== null);
    res.json(cars);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites: ' + error.message });
  }
});

// Add to favorites
router.post('/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    
    const [favorite, created] = await UserFavorite.findOrCreate({
      where: {
        userId: req.user.id,
        carId: carId
      }
    });
    
    res.json({ success: true, added: created });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite: ' + error.message });
  }
});

// Remove from favorites
router.delete('/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    
    const deleted = await UserFavorite.destroy({
      where: {
        userId: req.user.id,
        carId: carId
      }
    });
    
    res.json({ success: true, removed: deleted > 0 });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite: ' + error.message });
  }
});

// Check if car is favorited
router.get('/check/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    
    const favorite = await UserFavorite.findOne({
      where: {
        userId: req.user.id,
        carId: carId
      }
    });
    
    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Failed to check favorite: ' + error.message });
  }
});

module.exports = router;