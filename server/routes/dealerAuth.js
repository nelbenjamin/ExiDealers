const express = require('express');
const router = express.Router();
const { Dealer } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { requireDealerAuth, DEALER_JWT_SECRET } = require('../middleware/dealerAuth');

// ============= DEALER REGISTRATION WITH AUTO-LOGIN =============
router.post('/dealer/register', async (req, res) => {
  try {
    const { 
      businessName, 
      firstName, 
      lastName, 
      email, 
      username, 
      password, 
      phone, 
      whatsapp, 
      address, 
      businessRegistration 
    } = req.body;
    
    if (!businessName || !firstName || !lastName || !email || !username || !password || !phone) {
      return res.status(400).json({ 
        error: 'Business name, full name, email, username, password, and phone are required' 
      });
    }
    
    const existingDealer = await Dealer.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { username }
        ]
      } 
    });
    
    if (existingDealer) {
      if (existingDealer.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingDealer.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    
    const dealer = await Dealer.create({
      businessName,
      firstName,
      lastName,
      email,
      username,
      password,
      phone,
      whatsapp: whatsapp || null,
      address: address || null,
      businessRegistration: businessRegistration || null,
      isVerified: true,
      isActive: true,
      subscriptionTier: 'free',
      maxListings: 50
    });
    
    dealer.lastLogin = new Date();
    await dealer.save();
    
    const token = jwt.sign(
      { 
        id: dealer.id, 
        email: dealer.email,
        username: dealer.username,
        businessName: dealer.businessName,
        firstName: dealer.firstName,
        lastName: dealer.lastName
      },
      DEALER_JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.cookie('dealerToken', token, {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'Lax',
      path: '/'
    });
    
    res.json({
      success: true,
      message: 'Registration successful! Welcome to Exi Dealers.',
      dealer: {
        id: dealer.id,
        businessName: dealer.businessName,
        firstName: dealer.firstName,
        lastName: dealer.lastName,
        email: dealer.email,
        username: dealer.username,
        phone: dealer.phone,
        isVerified: dealer.isVerified,
        subscriptionTier: dealer.subscriptionTier,
        totalListings: dealer.totalListings,
        maxListings: dealer.maxListings
      },
      token,
      redirect: '/dealer-dashboard'
    });
    
  } catch (error) {
    console.error('Dealer registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ============= DEALER LOGIN =============
router.post('/dealer/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const loginIdentifier = username || email;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }
    
    const dealer = await Dealer.findOne({ 
      where: { 
        [Op.or]: [
          { username: loginIdentifier },
          { email: loginIdentifier }
        ],
        isActive: true 
      } 
    });
    
    if (!dealer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await dealer.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    dealer.lastLogin = new Date();
    await dealer.save();
    
    const token = jwt.sign(
      { 
        id: dealer.id, 
        email: dealer.email,
        username: dealer.username,
        businessName: dealer.businessName
      },
      DEALER_JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('Token generated successfully');
    
    res.cookie('dealerToken', token, {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'Lax',
      path: '/',
    });
    
    console.log('Cookie set in response');
    
    res.json({
      success: true,
      message: 'Login successful!',
      dealer: {
        id: dealer.id,
        businessName: dealer.businessName,
        firstName: dealer.firstName,
        lastName: dealer.lastName,
        email: dealer.email,
        username: dealer.username
      },
      token
    });
    
  } catch (error) {
    console.error('Dealer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============= DEALER LOGOUT =============
router.post('/dealer/logout', (req, res) => {
  res.clearCookie('dealerToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============= CHECK DEALER AUTH STATUS =============
router.get('/dealer/status', async (req, res) => {
  try {
    const token = req.cookies?.dealerToken || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    const decoded = jwt.verify(token, DEALER_JWT_SECRET);
    
    // FIX: isActive is now included so the check below works correctly
    const dealer = await Dealer.findByPk(decoded.id, {
      attributes: [
        'id', 'businessName', 'firstName', 'lastName', 'email',
        'username', 'phone', 'logo', 'isVerified', 'isActive',
        'subscriptionTier', 'totalListings', 'maxListings'
      ]
    });
    
    // isActive was previously missing from attributes, causing it to be
    // undefined (falsy), which made this check always redirect to login
    if (!dealer || !dealer.isActive) {
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      dealer: {
        id: dealer.id,
        businessName: dealer.businessName,
        firstName: dealer.firstName,
        lastName: dealer.lastName,
        email: dealer.email,
        username: dealer.username,
        phone: dealer.phone,
        logo: dealer.logo,
        isVerified: dealer.isVerified,
        subscriptionTier: dealer.subscriptionTier,
        totalListings: dealer.totalListings,
        maxListings: dealer.maxListings,
        initials: `${dealer.firstName.charAt(0)}${dealer.lastName.charAt(0)}`
      }
    });
    
  } catch (error) {
    console.error('Dealer auth status error:', error);
    res.json({ authenticated: false });
  }
});

// ============= GET DEALER PROFILE =============
router.get('/dealer/profile', requireDealerAuth, async (req, res) => {
  try {
    const dealer = await Dealer.findByPk(req.dealer.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    
    res.json(dealer);
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============= UPDATE DEALER PROFILE =============
router.put('/dealer/profile', requireDealerAuth, async (req, res) => {
  try {
    const { businessName, firstName, lastName, phone, whatsapp, address } = req.body;
    const dealer = await Dealer.findByPk(req.dealer.id);
    
    if (businessName) dealer.businessName = businessName;
    if (firstName) dealer.firstName = firstName;
    if (lastName) dealer.lastName = lastName;
    if (phone) dealer.phone = phone;
    if (whatsapp !== undefined) dealer.whatsapp = whatsapp;
    if (address !== undefined) dealer.address = address;
    
    await dealer.save();
    
    res.json({
      success: true,
      dealer: {
        id: dealer.id,
        businessName: dealer.businessName,
        firstName: dealer.firstName,
        lastName: dealer.lastName,
        email: dealer.email,
        phone: dealer.phone,
        whatsapp: dealer.whatsapp,
        address: dealer.address
      }
    });
  } catch (error) {
    console.error('Error updating dealer profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============= CHANGE DEALER PASSWORD =============
router.put('/dealer/change-password', requireDealerAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const dealer = await Dealer.findByPk(req.dealer.id);
    
    const isValid = await dealer.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    dealer.password = newPassword;
    await dealer.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;