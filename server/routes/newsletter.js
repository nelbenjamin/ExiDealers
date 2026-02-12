const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

// Get all subscribers (admin only)
router.get('/subscribers', async (req, res) => {
  try {
    const token = req.headers['admin-token'];
    if (!token || token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    const subscribers = await Newsletter.findAll({
      order: [['subscribedAt', 'DESC']]
    });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check if already subscribed
    const existingSubscriber = await Newsletter.findOne({ where: { email } });
    if (existingSubscriber) {
      return res.json({ message: 'Already subscribed' });
    }

    const newSubscriber = await Newsletter.create({
      email,
      subscribedAt: new Date()
    });

    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete subscriber (admin only)
router.delete('/subscribers/:id', async (req, res) => {
  try {
    const token = req.headers['admin-token'];
    if (!token || token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    const { id } = req.params;
    const subscriber = await Newsletter.findByPk(id);
    
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    await subscriber.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;