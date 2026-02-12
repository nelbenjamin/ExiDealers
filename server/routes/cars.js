const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Car, CarImage } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Configure Multer for image uploads with optimized limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// OPTIMIZED MULTER LIMITS
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // REDUCED to 10MB per file for better stability
    files: 20 // REDUCED to 20 files maximum
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const authToken = req.headers['admin-token'];
  if (authToken === process.env.ADMIN_SECRET) {
    return next();
  }
  res.status(403).json({ error: 'Unauthorized - Admin token required' });
};

// Helper function to parse mileage with km
const parseMileage = (mileageString) => {
  if (!mileageString) return null;
  const cleaned = mileageString.replace(/km|\s/g, '').replace(/[^\d]/g, '');
  return parseInt(cleaned) || null;
};

// NEW: Get unique brands for search dropdown
router.get('/brands/unique', async (req, res) => {
  try {
    const brands = await Car.findAll({
      attributes: ['make'],
      group: ['make'],
      order: [['make', 'ASC']],
      raw: true
    });
    
    const brandNames = brands.map(brand => brand.make);
    
    res.json({
      success: true,
      brands: brandNames
    });
    
  } catch (error) {
    console.error('Error fetching unique brands:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch brands' 
    });
  }
});

// NEW: Get brands with models and counts for search dropdown
router.get('/brands-models/counts', async (req, res) => {
  try {
    const cars = await Car.findAll({
      attributes: ['make', 'model'],
      raw: true
    });
    
    const brandsMap = {};
    
    cars.forEach(car => {
      const { make, model } = car;
      
      if (!brandsMap[make]) {
        brandsMap[make] = {};
      }
      
      if (!brandsMap[make][model]) {
        brandsMap[make][model] = 0;
      }
      
      brandsMap[make][model]++;
    });
    
    // Convert to the format needed for frontend
    const result = {};
    Object.keys(brandsMap).sort().forEach(brand => {
      result[brand] = Object.keys(brandsMap[brand])
        .map(model => ({
          name: model,
          count: brandsMap[brand][model]
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
    
    res.json({
      success: true,
      brandsWithModels: result
    });
    
  } catch (error) {
    console.error('Error fetching brands with models:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch brands with models' 
    });
  }
});

// Get all cars with pagination and filtering - COMPLETELY FIXED PRICE FILTERING
router.get('/', async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // Get filter parameters
    const search = req.query.search || '';
    const brand = req.query.brand || '';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const location = req.query.location || '';
    const sort = req.query.sort || 'createdAt_DESC';

    // Advanced filter parameters
    const minYear = req.query.minYear ? parseInt(req.query.minYear) : null;
    const maxYear = req.query.maxYear ? parseInt(req.query.maxYear) : null;
    const minMileage = req.query.minMileage ? parseInt(req.query.minMileage) : null;
    const maxMileage = req.query.maxMileage ? parseInt(req.query.maxMileage) : null;
    const bodyTypes = req.query.bodyTypes ? req.query.bodyTypes.split(',') : [];
    const transmissions = req.query.transmissions ? req.query.transmissions.split(',') : [];
    const fuelTypes = req.query.fuelTypes ? req.query.fuelTypes.split(',') : [];
    const driveTypes = req.query.driveTypes ? req.query.driveTypes.split(',') : [];
    const conditions = req.query.conditions ? req.query.conditions.split(',') : [];

    // Build where conditions for filtering (EXCLUDING price)
    const whereConditions = {};

    // Search filter (make, model, location)
    if (search) {
      whereConditions[Op.or] = [
        { make: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    // Brand filter
    if (brand) {
      whereConditions.make = { [Op.like]: `%${brand}%` };
    }

    // Location filter
    if (location) {
      whereConditions.location = { [Op.like]: `%${location}%` };
    }

    // Year filters
    if (minYear !== null || maxYear !== null) {
      whereConditions.year = {};
      if (minYear !== null) whereConditions.year[Op.gte] = minYear;
      if (maxYear !== null) whereConditions.year[Op.lte] = maxYear;
    }

    // Mileage filters
    if (minMileage !== null || maxMileage !== null) {
      whereConditions.mileage = {};
      if (minMileage !== null) whereConditions.mileage[Op.gte] = minMileage;
      if (maxMileage !== null) whereConditions.mileage[Op.lte] = maxMileage;
    }

    // Body type filter
    if (bodyTypes.length > 0) {
      whereConditions.bodyType = { [Op.in]: bodyTypes };
    }

    // Transmission filter
    if (transmissions.length > 0) {
      whereConditions.transmission = { [Op.in]: transmissions };
    }

    // Fuel type filter
    if (fuelTypes.length > 0) {
      whereConditions.fuelType = { [Op.in]: fuelTypes };
    }

    // Drive type filter
    if (driveTypes.length > 0) {
      whereConditions.driveType = { [Op.in]: driveTypes };
    }

    // Condition filter
    if (conditions.length > 0) {
      whereConditions.condition = { [Op.in]: conditions };
    }

    // Build order conditions
    let order = [];
    switch (sort) {
      case 'priceLowHigh':
        order = [['price', 'ASC']];
        break;
      case 'priceHighLow':
        order = [['price', 'DESC']];
        break;
      case 'yearNewOld':
        order = [['year', 'DESC']];
        break;
      case 'yearOldNew':
        order = [['year', 'ASC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    console.log('🔍 Fetching cars with filters (excluding price):', whereConditions);
    console.log('💰 Price filter requested:', { minPrice, maxPrice });

    // FIRST: Fetch ALL cars matching non-price filters
    let allFilteredCars;
    let totalWithoutPriceFilter;
    
    try {
      // Get total count without price filter
      totalWithoutPriceFilter = await Car.count({ where: whereConditions });
      
      // Fetch ALL cars matching non-price filters (with a reasonable limit for performance)
      const fetchLimit = Math.min(limit * 10, 1000); // Fetch up to 1000 cars max for price filtering
      allFilteredCars = await Car.findAll({
        where: whereConditions,
        include: [{ 
          model: CarImage, 
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'order']
        }],
        order: order,
        limit: fetchLimit,
        offset: 0
      });
      
      console.log(`📊 Found ${allFilteredCars.length} cars (out of ${totalWithoutPriceFilter} total) matching non-price filters`);
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback if createdAt doesn't exist
        totalWithoutPriceFilter = await Car.count({ where: whereConditions });
        allFilteredCars = await Car.findAll({
          where: whereConditions,
          include: [{ 
            model: CarImage, 
            as: 'images',
            attributes: ['id', 'imageUrl', 'isPrimary', 'order']
          }],
          order: [['id', 'DESC']],
          limit: Math.min(limit * 10, 1000),
          offset: 0
        });
      } else {
        throw error;
      }
    }
    
    // ***** APPLY PRICE FILTERING CLIENT-SIDE FOR 100% ACCURACY *****
    let finalCars = allFilteredCars;
    let totalWithPriceFilter = totalWithoutPriceFilter;
    
    if (minPrice !== null || maxPrice !== null) {
      console.log('🔍 Applying price filter client-side:', { minPrice, maxPrice });
      
      const filteredCars = allFilteredCars.filter(car => {
        const priceStr = car.price || '';
        const numericPrice = extractNumericPrice(priceStr);
        
        if (numericPrice === null) {
          return false; // Exclude POA/unknown prices
        }
        
        if (minPrice !== null && numericPrice < minPrice) {
          return false;
        }
        
        if (maxPrice !== null && numericPrice > maxPrice) {
          return false;
        }
        
        return true;
      });
      
      console.log(`✅ Price filtering: ${allFilteredCars.length} total, ${filteredCars.length} after filter`);
      finalCars = filteredCars;
      totalWithPriceFilter = filteredCars.length;
    }
    
    // Apply pagination to the final filtered results
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, finalCars.length);
    const paginatedCars = finalCars.slice(startIndex, endIndex);
    
    console.log(`📄 Pagination: Showing ${paginatedCars.length} cars (${startIndex + 1}-${endIndex}) of ${totalWithPriceFilter} total`);
    
    // Convert to plain objects
    const carsData = paginatedCars.map(car => car.get({ plain: true }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalWithPriceFilter / limit);
    
    res.json({
      cars: carsData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCars: totalWithPriceFilter,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Helper function to extract numeric price from string
function extractNumericPrice(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') {
    console.log(`  ⚠️ Price is null or not string:`, priceStr);
    return null;
  }
  
  // Convert to uppercase for consistent matching
  const upperStr = priceStr.toUpperCase().trim();
  
  // Check for POA/P.O.A
  if (upperStr.includes('POA') || upperStr.includes('P.O.A') || upperStr === 'POA' || upperStr === 'P.O.A') {
    return null;
  }
  
  // Check for "CALL" or "NEGOTIABLE"
  if (upperStr.includes('CALL') || upperStr.includes('NEGOTIABLE') || upperStr.includes('CONTACT')) {
    return null;
  }
  
  // Try to extract numbers - handle multiple formats
  let numberStr = upperStr;
  
  // Remove currency symbols and text
  numberStr = numberStr.replace(/N\$|\$|USD|NAD|ZAR|R|,/g, '');
  
  // Remove spaces
  numberStr = numberStr.replace(/\s/g, '');
  
  // Try to extract first number sequence
  const match = numberStr.match(/(\d+\.?\d*)/);
  
  if (!match) {
    return null;
  }
  
  const numericPrice = parseFloat(match[0]);
  
  // Check if it's a valid number
  if (isNaN(numericPrice) || !isFinite(numericPrice)) {
    return null;
  }
  
  return numericPrice;
}

// Add a new car listing
router.post('/', adminAuth, upload.array('carImages', 20), async (req, res) => {
  try {
    console.log('📸 Files received:', req.files ? req.files.length : 0);
    
    // Check if files are too large
    if (req.files) {
      const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
      console.log('📦 Total upload size:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
      
      if (totalSize > 100 * 1024 * 1024) {
        return res.status(413).json({ error: 'Total upload size too large. Maximum 100MB total.' });
      }
    }
    
    const carData = req.body;
    
    if (carData.mileage) {
      carData.mileage = parseMileage(carData.mileage);
      if (carData.mileage === null) {
        return res.status(400).json({ error: 'Invalid mileage format. Use format like: 120000 or 120 000 km' });
      }
    }
    
    carData.year = parseInt(carData.year);
    
    const newCar = await Car.create(carData);
    
    if (req.files && req.files.length > 0) {
      const primaryImageIndex = parseInt(carData.primaryImageIndex) || 0;
      
      const imagePromises = req.files.map((file, index) => {
        return CarImage.create({
          carId: newCar.id,
          imageUrl: `/uploads/${file.filename}`,
          isPrimary: index === primaryImageIndex,
          order: index
        });
      });
      
      await Promise.all(imagePromises);
    }

    const carWithImages = await Car.findByPk(newCar.id, {
      include: [{ 
        model: CarImage, 
        as: 'images',
        attributes: ['id', 'imageUrl', 'isPrimary', 'order']
      }]
    });
    
    res.json(carWithImages.get({ plain: true }));
    
  } catch (error) {
    console.error('Error creating car:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB per image.' });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({ error: 'Too many files. Maximum 20 images allowed.' });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected file field.' });
      }
    }
    
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// UPDATE CAR ROUTE
router.post('/:id/update', adminAuth, upload.array('carImages', 20), async (req, res) => {
  try {
    const carId = req.params.id;
    const carData = req.body;
    
    console.log('🔄 UPDATE route called for car ID:', carId);
    console.log('📸 Files received for update:', req.files ? req.files.length : 0);
    
    if (req.files) {
      const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
      console.log('📦 Total upload size:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
      
      if (totalSize > 100 * 1024 * 1024) {
        return res.status(413).json({ error: 'Total upload size too large. Maximum 100MB total.' });
      }
    }
    
    const existingCar = await Car.findByPk(carId);
    if (!existingCar) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    if (carData.mileage) {
      carData.mileage = parseMileage(carData.mileage);
      if (carData.mileage === null) {
        return res.status(400).json({ error: 'Invalid mileage format' });
      }
    }
    
    if (carData.year) {
      carData.year = parseInt(carData.year);
    }
    
    await existingCar.update(carData);
    
    if (carData.existingImages) {
      try {
        const existingImages = JSON.parse(carData.existingImages);
        await CarImage.destroy({ where: { carId: carId } });
        
        const existingImagePromises = existingImages.map((img, index) => {
          return CarImage.create({
            carId: carId,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
            order: index
          });
        });
        
        await Promise.all(existingImagePromises);
      } catch (parseError) {
        console.error('Error parsing existing images:', parseError);
      }
    }
    
    if (req.files && req.files.length > 0) {
      const primaryImageIndex = parseInt(carData.primaryImageIndex) || 0;
      
      const newImagePromises = req.files.map((file, index) => {
        return CarImage.create({
          carId: carId,
          imageUrl: `/uploads/${file.filename}`,
          isPrimary: index === primaryImageIndex,
          order: index
        });
      });
      
      await Promise.all(newImagePromises);
    }

    const updatedCar = await Car.findByPk(carId, {
      include: [{ 
        model: CarImage, 
        as: 'images',
        attributes: ['id', 'imageUrl', 'isPrimary', 'order']
      }]
    });
    
    res.json(updatedCar.get({ plain: true }));
    
  } catch (error) {
    console.error('Error updating car:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB per image.' });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({ error: 'Too many files. Maximum 20 images allowed.' });
      }
    }
    
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Delete a car listing
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    await CarImage.destroy({ where: { carId: req.params.id } });
    await car.destroy();
    res.json({ success: true, message: 'Car removed successfully' });
  } catch (err) {
    console.error('Error deleting car:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single car by ID
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findByPk(req.params.id, {
      include: [{ 
        model: CarImage, 
        as: 'images',
        attributes: ['id', 'imageUrl', 'isPrimary', 'order']
      }]
    });
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json(car.get({ plain: true }));
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;