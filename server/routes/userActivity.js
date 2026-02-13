const express = require('express');
const router = express.Router();
const { UserActivity, Car, CarImage } = require('../models');
const { requireAuth } = require('./auth');

// Get user's recent activities
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log(`📊 Fetching activities for user: ${req.user.id}`);
    
    const activities = await UserActivity.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Car,
        as: 'car',
        include: [{
          model: CarImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'order']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    console.log(`✅ Found ${activities.length} activities for user ${req.user.id}`);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities: ' + error.message });
  }
});

// Log an activity (internal use, not exposed as API endpoint directly)
async function logActivity(userId, activityType, carId = null, details = null) {
  try {
    if (!userId) {
      console.log('⚠️ No userId provided, skipping activity log');
      return false;
    }
    
    const activity = await UserActivity.create({
      userId,
      activityType,
      carId,
      details
    });
    
    console.log(`✅ Activity logged: ${activityType} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

module.exports = { router, logActivity };