const express = require('express');
const router = express.Router();
const { Contact } = require('../models');

// GET all messages (admin only)
router.get('/', async (req, res) => {
  try {
    const token = req.headers['admin-token'];
    if (!token || token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    // Try to get messages with createdAt field
    let messages;
    try {
      messages = await Contact.findAll({
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      // If createdAt field doesn't exist, fall back to id ordering
      if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.code === 'ER_BAD_FIELD_ERROR') {
        messages = await Contact.findAll({
          order: [['id', 'DESC']]
        });
      } else {
        throw error;
      }
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const newMessage = await Contact.create({
      name,
      email,
      subject: subject || 'No Subject',
      message
    });

    res.json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE message (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers['admin-token'];
    if (!token || token !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    const { id } = req.params;
    const message = await Contact.findByPk(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;