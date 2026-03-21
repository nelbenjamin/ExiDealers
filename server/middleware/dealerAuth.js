const jwt = require('jsonwebtoken');
const { Dealer } = require('../models');

const DEALER_JWT_SECRET = process.env.DEALER_JWT_SECRET || 'dealer-secret-key-change-this-in-production';

// Middleware to check if dealer is authenticated
const requireDealerAuth = async (req, res, next) => {
  const token = req.cookies?.dealerToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      authenticated: false, 
      error: 'No token provided',
      redirect: '/dealer-login' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, DEALER_JWT_SECRET);
    
    // Check if dealer still exists and is active
    const dealer = await Dealer.findByPk(decoded.id, {
      attributes: ['id', 'businessName', 'firstName', 'lastName', 'email', 'username', 'isActive', 'isVerified', 'maxListings', 'totalListings']
    });
    
    if (!dealer || !dealer.isActive) {
      return res.status(401).json({ 
        authenticated: false, 
        error: 'Dealer account not found or inactive' 
      });
    }
    
    req.dealer = dealer.get({ plain: true });
    next();
  } catch (error) {
    return res.status(401).json({ 
      authenticated: false, 
      error: 'Invalid token' 
    });
  }
};

// Optional auth - doesn't error if no token, just sets req.dealer to null
const optionalDealerAuth = async (req, res, next) => {
  const token = req.cookies?.dealerToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    req.dealer = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, DEALER_JWT_SECRET);
    const dealer = await Dealer.findByPk(decoded.id, {
      attributes: ['id', 'businessName', 'firstName', 'lastName', 'email', 'username']
    });
    
    req.dealer = dealer ? dealer.get({ plain: true }) : null;
    next();
  } catch (error) {
    req.dealer = null;
    next();
  }
};

module.exports = { requireDealerAuth, optionalDealerAuth, DEALER_JWT_SECRET };