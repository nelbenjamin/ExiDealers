const Car = require('../models/Car');
const CarImage = require('../models/CarImage');
const { Op } = require('sequelize');

const carQueries = {
  // Get all cars with pagination and filtering
  getAllCars: async (page = 1, limit = 15, filters = {}) => {
    try {
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {};
      
      // Search filter
      if (filters.search) {
        whereConditions[Op.or] = [
          { make: { [Op.like]: `%${filters.search}%` } },
          { model: { [Op.like]: `%${filters.search}%` } },
          { location: { [Op.like]: `%${filters.search}%` } }
        ];
      }
      
      // Brand filter
      if (filters.brand) {
        whereConditions.make = filters.brand;
      }
      
      // Price filters
      if (filters.minPrice) {
        whereConditions.price = {
          ...whereConditions.price,
          [Op.gte]: filters.minPrice
        };
      }
      
      if (filters.maxPrice) {
        whereConditions.price = {
          ...whereConditions.price,
          [Op.lte]: filters.maxPrice
        };
      }
      
      // Location filter
      if (filters.location) {
        whereConditions.location = filters.location;
      }
      
      // Year filters
      if (filters.minYear) {
        whereConditions.year = {
          ...whereConditions.year,
          [Op.gte]: filters.minYear
        };
      }
      
      if (filters.maxYear) {
        whereConditions.year = {
          ...whereConditions.year,
          [Op.lte]: filters.maxYear
        };
      }
      
      // Mileage filters
      if (filters.minMileage) {
        whereConditions.mileage = {
          ...whereConditions.mileage,
          [Op.gte]: filters.minMileage
        };
      }
      
      if (filters.maxMileage) {
        whereConditions.mileage = {
          ...whereConditions.mileage,
          [Op.lte]: filters.maxMileage
        };
      }
      
      // Body type filter
      if (filters.bodyTypes && filters.bodyTypes.length > 0) {
        whereConditions.bodyType = {
          [Op.in]: filters.bodyTypes
        };
      }
      
      // Transmission filter
      if (filters.transmissions && filters.transmissions.length > 0) {
        whereConditions.transmission = {
          [Op.in]: filters.transmissions
        };
      }
      
      // Fuel type filter
      if (filters.fuelTypes && filters.fuelTypes.length > 0) {
        whereConditions.fuelType = {
          [Op.in]: filters.fuelTypes
        };
      }
      
      // Drive type filter
      if (filters.driveTypes && filters.driveTypes.length > 0) {
        whereConditions.driveType = {
          [Op.in]: filters.driveTypes
        };
      }
      
      // Condition filter
      if (filters.conditions && filters.conditions.length > 0) {
        whereConditions.condition = {
          [Op.in]: filters.conditions
        };
      }
      
      // Build order conditions
      let order = [['createdAt', 'DESC']];
      
      if (filters.sort) {
        switch (filters.sort) {
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
        }
      }
      
      const { count, rows: cars } = await Car.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: CarImage,
            as: 'images',
            attributes: ['id', 'imageUrl', 'isPrimary']
          }
        ],
        order: order,
        limit: limit,
        offset: offset,
        distinct: true
      });
      
      return {
        cars,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalCars: count,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
      
    } catch (error) {
      console.error('Error in getAllCars query:', error);
      throw error;
    }
  },
  
  // Get unique brands for filters
  getUniqueBrands: async () => {
    try {
      const brands = await Car.findAll({
        attributes: ['make'],
        group: ['make'],
        order: [['make', 'ASC']]
      });
      
      return brands.map(brand => brand.make);
    } catch (error) {
      console.error('Error in getUniqueBrands query:', error);
      throw error;
    }
  },
  
  // Get brands with models and counts
  getBrandsWithModels: async () => {
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
      Object.keys(brandsMap).forEach(brand => {
        result[brand] = Object.keys(brandsMap[brand]).map(model => ({
          name: model,
          count: brandsMap[brand][model]
        })).sort((a, b) => a.name.localeCompare(b.name));
      });
      
      return result;
    } catch (error) {
      console.error('Error in getBrandsWithModels query:', error);
      throw error;
    }
  },
  
  // Get car by ID with images
  getCarById: async (carId) => {
    try {
      const car = await Car.findByPk(carId, {
        include: [
          {
            model: CarImage,
            as: 'images',
            attributes: ['id', 'imageUrl', 'isPrimary']
          }
        ]
      });
      
      return car;
    } catch (error) {
      console.error('Error in getCarById query:', error);
      throw error;
    }
  }
};

module.exports = carQueries;