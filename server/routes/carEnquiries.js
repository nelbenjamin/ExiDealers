const express = require('express');
const router = express.Router();
const { CarEnquiry } = require('../models');

// Create new car enquiry
router.post('/', async (req, res) => {
  try {
    const enquiryData = req.body;
    
    const newEnquiry = await CarEnquiry.create(enquiryData);
    res.json(newEnquiry);
    
  } catch (error) {
    console.error('Error creating car enquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all car enquiries (admin only)
router.get('/', async (req, res) => {
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

// Delete car enquiry
router.delete('/:id', async (req, res) => {
  try {
    const enquiry = await CarEnquiry.findByPk(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Car enquiry not found' });
    }
    
    await enquiry.destroy();
    res.json({ success: true, message: 'Car enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting car enquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;