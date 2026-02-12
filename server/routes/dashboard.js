const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { Car, PriceAlert, Newsletter, Contact, CarEnquiry } = require('../models'); // Add CarEnquiry

// Protect all dashboard routes with adminAuth
router.use(adminAuth);

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalCars = await Car.count();
    const totalPriceAlerts = await PriceAlert.count();
    const totalNewsletterSubscribers = await Newsletter.count();
    const totalMessages = await Contact.count();
    const totalCarEnquiries = await CarEnquiry.count(); // Add this line
    
    res.json({
      totalCars,
      totalPriceAlerts,
      totalNewsletterSubscribers,
      totalMessages,
      totalCarEnquiries // Add this line
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all messages for dashboard
router.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages for dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all cars for dashboard
router.get('/cars', async (req, res) => {
  try {
    const cars = await Car.findAll({
      include: ['images']
    });
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars for dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all price alerts
router.get('/price-alerts', async (req, res) => {
  try {
    const alerts = await PriceAlert.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all newsletter subscribers - FIXED: Use subscribedAt instead of createdAt
router.get('/newsletter', async (req, res) => {
  try {
    const subscribers = await Newsletter.findAll({
      order: [['subscribedAt', 'DESC']] // CHANGED: createdAt -> subscribedAt
    });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all car enquiries
router.get('/car-enquiries', async (req, res) => {
  try {
    const enquiries = await CarEnquiry.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(enquiries);
  } catch (error) {
    console.error('Error fetching car enquiries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;