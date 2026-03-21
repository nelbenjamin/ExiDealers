const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Car, CarImage, Dealer } = require('../models');
const { requireDealerAuth } = require('../middleware/dealerAuth');
const { Op } = require('sequelize');

// ============================================================
// IMPORTANT: This router is mounted at /api/dealer in server/index.js
// So routes here must NOT include /dealer/ prefix
// e.g. router.get('/my-cars') becomes GET /api/dealer/my-cars
// ============================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const dealerPart = (req.dealer && req.dealer.id) ? req.dealer.id : 'tmp';
    cb(null, 'dealer-' + dealerPart + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())
            && /image/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});

// Always returns JSON for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large. Max 20MB per image.' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(413).json({ error: 'Too many files. Max 40 images.' });
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

// GET /api/dealer/my-cars
router.get('/my-cars', requireDealerAuth, async (req, res) => {
  try {
    const cars = await Car.findAll({
      where: { dealerId: req.dealer.id },
      include: [{ model: CarImage, as: 'images', attributes: ['id', 'imageUrl', 'isPrimary'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(cars);
  } catch (e) {
    console.error('Error fetching dealer cars:', e);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// POST /api/dealer/cars  — add new car
router.post('/cars', requireDealerAuth, upload.array('carImages', 40), handleMulterError, async (req, res) => {
  try {
    const dealer = await Dealer.findByPk(req.dealer.id);
    const {
      make, model, year, price, mileage, location, description, condition,
      bodyType, transmission, fuelType, driveType,
      sellerName, sellerEmail, sellerPhone, preferredContact, primaryImageIndex
    } = req.body;

    if (!make || !model || !year || !price || !mileage || !location || !description || !condition) {
      if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch(e) {} });
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const car = await Car.create({
      make, model, year: parseInt(year), price, mileage, location, description, condition,
      bodyType: bodyType || null, transmission: transmission || null,
      fuelType: fuelType || null, driveType: driveType || null,
      sellerName: sellerName || `${dealer.firstName} ${dealer.lastName}`,
      sellerEmail: sellerEmail || dealer.email,
      sellerPhone: sellerPhone || dealer.phone,
      preferredContact: preferredContact || 'email',
      dealerId: dealer.id
    });

    if (req.files && req.files.length > 0) {
      const pi = parseInt(primaryImageIndex) || 0;
      for (let i = 0; i < req.files.length; i++) {
        await CarImage.create({
          carId: car.id,
          imageUrl: `/uploads/${req.files[i].filename}`,
          isPrimary: i === pi
        });
      }
    }

    await Dealer.increment('totalListings', { where: { id: dealer.id } });

    const created = await Car.findByPk(car.id, {
      include: [{ model: CarImage, as: 'images' }]
    });
    res.status(201).json({ success: true, message: 'Car added successfully', car: created });

  } catch (e) {
    console.error('Error adding car:', e);
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch(ex) {} });
    res.status(500).json({ error: 'Failed to add car: ' + e.message });
  }
});

// POST /api/dealer/cars/:id  — update car
router.post('/cars/:id', requireDealerAuth, upload.array('carImages', 40), handleMulterError, async (req, res) => {
  try {
    const car = await Car.findOne({ where: { id: req.params.id, dealerId: req.dealer.id } });
    if (!car) return res.status(404).json({ error: 'Car not found or no permission' });

    const {
      make, model, year, price, mileage, location, description, condition,
      bodyType, transmission, fuelType, driveType,
      sellerName, sellerEmail, sellerPhone, preferredContact,
      primaryImageIndex, existingImages
    } = req.body;

    if (make) car.make = make; if (model) car.model = model;
    if (year) car.year = parseInt(year); if (price) car.price = price;
    if (mileage) car.mileage = mileage; if (location) car.location = location;
    if (description) car.description = description; if (condition) car.condition = condition;
    if (bodyType !== undefined) car.bodyType = bodyType;
    if (transmission !== undefined) car.transmission = transmission;
    if (fuelType !== undefined) car.fuelType = fuelType;
    if (driveType !== undefined) car.driveType = driveType;
    if (sellerName) car.sellerName = sellerName;
    if (sellerEmail) car.sellerEmail = sellerEmail;
    if (sellerPhone) car.sellerPhone = sellerPhone;
    if (preferredContact) car.preferredContact = preferredContact;
    await car.save();

    if (existingImages) {
      try {
        const imgs = JSON.parse(existingImages);
        for (const img of imgs) {
          await CarImage.update({ isPrimary: img.isPrimary || false }, { where: { id: img.id, carId: car.id } });
        }
        const ids = imgs.map(i => i.id);
        await CarImage.destroy({ where: { carId: car.id, id: { [Op.notIn]: ids } } });
      } catch(pe) { console.error('Parse existing images error:', pe); }
    }

    if (req.files && req.files.length > 0) {
      const pi = parseInt(primaryImageIndex) || 0;
      const total = await CarImage.count({ where: { carId: car.id } });
      for (let i = 0; i < req.files.length; i++) {
        await CarImage.create({
          carId: car.id,
          imageUrl: `/uploads/${req.files[i].filename}`,
          isPrimary: (total + i) === pi
        });
      }
    }

    const updated = await Car.findByPk(car.id, {
      include: [{ model: CarImage, as: 'images' }]
    });
    res.json({ success: true, message: 'Car updated successfully', car: updated });

  } catch (e) {
    console.error('Error updating car:', e);
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch(ex) {} });
    res.status(500).json({ error: 'Failed to update car: ' + e.message });
  }
});

// DELETE /api/dealer/cars/:id
router.delete('/cars/:id', requireDealerAuth, async (req, res) => {
  try {
    const car = await Car.findOne({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: [{ model: CarImage, as: 'images' }]
    });
    if (!car) return res.status(404).json({ error: 'Car not found or no permission' });

    if (car.images) {
      for (const img of car.images) {
        const fp = path.join(__dirname, '../uploads', img.imageUrl.split('/').pop());
        try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch(e) {}
      }
    }
    await car.destroy();
    await Dealer.decrement('totalListings', { where: { id: req.dealer.id } });
    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (e) {
    console.error('Error deleting car:', e);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

// GET /api/dealer/cars/:id  — single car for editing
router.get('/cars/:id', requireDealerAuth, async (req, res) => {
  try {
    const car = await Car.findOne({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: [{ model: CarImage, as: 'images' }]
    });
    if (!car) return res.status(404).json({ error: 'Car not found' });
    res.json(car);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch car' });
  }
});

// GET /api/dealer/stats
router.get('/stats', requireDealerAuth, async (req, res) => {
  try {
    const totalCars = await Car.count({ where: { dealerId: req.dealer.id } });
    const recentCars = await Car.findAll({
      where: { dealerId: req.dealer.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'make', 'model', 'year', 'createdAt']
    });
    res.json({ totalCars, totalViews: 0, subscriptionTier: req.dealer.subscriptionTier, recentCars });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;