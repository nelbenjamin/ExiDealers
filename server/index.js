const express = require('express');
const app = express();
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

// ============================================
// MODEL IMPORTS FOR SEO ROUTES
// ============================================
const { Car, CarImage } = require('./models');

// ============================================
// EJS CONFIGURATION
// ============================================
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client/views'));

// ============================================
// HELPER FUNCTIONS FOR EJS TEMPLATES
// ============================================
function generateDescription(car) {
    return `View this ${car.year} ${car.make} ${car.model} for sale in ${car.location}, Namibia. ${car.mileage?.toLocaleString() || ''}km, ${car.condition || 'used'} condition. Price: ${car.price || 'N/A'}. Contact Exi Dealers today!`;
}

function generateShortDescription(car) {
    if (car.description) {
        return car.description.substring(0, 160) + '...';
    }
    return `${car.year} ${car.make} ${car.model} with ${car.mileage?.toLocaleString() || ''}km. Located in ${car.location}.`;
}

function formatPrice(price) {
    return price?.toString() || 'N/A';
}

function extractNumericPrice(priceStr) {
    if (!priceStr) return '0';
    const match = priceStr.toString().match(/(\d+[,\d]*\.?\d*)/);
    return match ? match[0].replace(/,/g, '') : '0';
}

function capitalize(str) {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeJson(str) {
    if (!str) return '';
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// Remove CSP headers
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ 
  limit: '100mb', 
  extended: true,
  parameterLimit: 50000
}));

// Cookie parser middleware - IMPORTANT: Place this BEFORE routes
app.use(cookieParser());

// Get the correct base directory path
const baseDir = path.join(__dirname, '..');

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(baseDir, 'client')));
app.use(express.static(path.join(__dirname, 'public')));

// Serve styles.css
app.use('/admin/styles.css', (req, res) => {
  const stylesPath = path.join(__dirname, 'public', 'styles.css');
  if (fs.existsSync(stylesPath)) {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(stylesPath);
  } else {
    const clientStylesPath = path.join(baseDir, 'client', 'styles.css');
    if (fs.existsSync(clientStylesPath)) {
      res.setHeader('Content-Type', 'text/css');
      res.sendFile(clientStylesPath);
    } else {
      res.status(404).send('Stylesheet not found');
    }
  }
});

// ============================================
// API ROUTES
// ============================================

// User auth routes - mounted at BOTH paths so all frontend pages work
// /api/auth  --> used by login.html, register.html, profile.html, and all nav bars
// /api/user/auth --> also kept for any future use
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/user/auth', require('./routes/auth').router);

// Dealer auth routes (for dealers)
app.use('/api/dealer/auth', require('./routes/dealerAuth'));

// Dealer cars routes
app.use('/api/dealer', require('./routes/dealerCars'));

// Other API routes
app.use('/api/cars', require('./routes/cars'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/price-alerts', require('./routes/priceAlerts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/car-enquiries', require('./routes/carEnquiries'));

// User feature routes
app.use('/api/user/favorites', require('./routes/userFavorites'));
app.use('/api/user/saved', require('./routes/userSaved'));
app.use('/api/user/alerts', require('./routes/userAlerts'));
app.use('/api/user/activities', require('./routes/userActivity').router);

// ============================================
// SEO-FRIENDLY CAR DETAILS ROUTE
// ============================================
app.get('/car/:slug-:id', async (req, res) => {
    try {
        const carId = req.params.id;
        
        const car = await Car.findByPk(carId, {
            include: [{
                model: CarImage,
                as: 'images',
                attributes: ['id', 'imageUrl', 'isPrimary']
            }]
        });
        
        if (!car) {
            return res.redirect('/view');
        }
        
        const carData = car.get({ plain: true });
        
        const expectedSlug = `${carData.year}-${carData.make}-${carData.model}-${carData.location}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        if (req.params.slug !== expectedSlug) {
            return res.redirect(301, `/car/${expectedSlug}-${carData.id}`);
        }
        
        carData.slug = expectedSlug;
        carData.primaryImage = carData.images?.find(img => img.isPrimary)?.imageUrl || 
                               carData.images?.[0]?.imageUrl || 
                               'https://via.placeholder.com/800x500?text=No+Image';
        
        res.render('car-details', {
            car: carData,
            generateDescription,
            generateShortDescription,
            formatPrice,
            extractNumericPrice,
            capitalize,
            escapeJson
        });
        
    } catch (error) {
        console.error('Error rendering car details:', error);
        res.status(500).send('Error loading car details');
    }
});

// Backward compatibility for old route
app.get('/car-details.html', async (req, res) => {
    if (req.query.id) {
        try {
            const car = await Car.findByPk(req.query.id);
            if (car) {
                const slug = `${car.year}-${car.make}-${car.model}-${car.location}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                return res.redirect(301, `/car/${slug}-${car.id}`);
            }
        } catch (error) {
            return res.redirect(301, `/car/${req.query.id}`);
        }
    }
    res.redirect('/view');
});

// ============================================
// PAGE ROUTES
// ============================================

// Dealer pages
app.get('/dealer-login', (req, res) => {
    const loginPath = path.join(baseDir, 'client', 'dealer-login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.status(404).send('Dealer login page not found');
    }
});

app.get('/dealer-register', (req, res) => {
    const registerPath = path.join(baseDir, 'client', 'dealer-register.html');
    if (fs.existsSync(registerPath)) {
        res.sendFile(registerPath);
    } else {
        res.status(404).send('Dealer register page not found');
    }
});

app.get('/dealer-dashboard', (req, res) => {
    const dashboardPath = path.join(baseDir, 'client', 'dealer-dashboard.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dealer dashboard not found');
    }
});

// Admin pages
app.get('/admin', (req, res) => {
    const adminLoginPath = path.join(__dirname, 'public', 'admin-login.html');
    if (fs.existsSync(adminLoginPath)) {
        res.sendFile(adminLoginPath);
    } else {
        res.status(404).send('Admin login page not found');
    }
});

app.get('/admin/dashboard', (req, res) => {
    const headerToken = req.headers['admin-token'];
    const queryToken = req.query.token;
    const token = headerToken || queryToken;
    
    if (token && token === process.env.ADMIN_SECRET) {
        const adminPath = path.join(__dirname, 'public', 'admin.html');
        if (fs.existsSync(adminPath)) {
            res.sendFile(adminPath);
        } else {
            res.status(404).send('Admin dashboard not found');
        }
    } else {
        res.redirect('/admin');
    }
});

app.get('/admin.html', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.status(404).send('Admin page not found');
    }
});

// User authentication pages
app.get('/login', (req, res) => {
    const loginPath = path.join(baseDir, 'client', 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.status(404).send('Login page not found');
    }
});

app.get('/register', (req, res) => {
    const registerPath = path.join(baseDir, 'client', 'register.html');
    if (fs.existsSync(registerPath)) {
        res.sendFile(registerPath);
    } else {
        res.status(404).send('Register page not found');
    }
});

app.get('/profile', (req, res) => {
    const profilePath = path.join(baseDir, 'client', 'profile.html');
    if (fs.existsSync(profilePath)) {
        res.sendFile(profilePath);
    } else {
        res.status(404).send('Profile page not found');
    }
});

// Client pages
app.get('/', (req, res) => {
    const indexPath = path.join(baseDir, 'client', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Home page not found');
    }
});

app.get('/view', (req, res) => {
    const viewPath = path.join(baseDir, 'client', 'view.html');
    if (fs.existsSync(viewPath)) {
        res.sendFile(viewPath);
    } else {
        res.status(404).send('View page not found');
    }
});

app.get('/contact', (req, res) => {
    const contactPath = path.join(baseDir, 'client', 'contact.html');
    if (fs.existsSync(contactPath)) {
        res.sendFile(contactPath);
    } else {
        res.status(404).send('Contact page not found');
    }
});

// ============================================
// SITEMAP & ROBOTS
// ============================================
app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    
    const BASE_URL = 'https://exidealers.com';
    
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/view', priority: '0.9', changefreq: 'hourly' },
        { url: '/contact', priority: '0.7', changefreq: 'monthly' },
        { url: '/login', priority: '0.4', changefreq: 'monthly' },
        { url: '/register', priority: '0.4', changefreq: 'monthly' }
    ];
    
    const cars = await Car.findAll({
        attributes: ['id', 'make', 'model', 'year', 'location', 'updatedAt']
    });
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    staticPages.forEach(page => {
        sitemap += `
    <url>
        <loc>${BASE_URL}${page.url}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
    });
    
    cars.forEach(car => {
        const slug = `${car.year}-${car.make}-${car.model}-${car.location}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
            
        sitemap += `
    <url>
        <loc>${BASE_URL}/car/${slug}-${car.id}</loc>
        <lastmod>${car.updatedAt.toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    res.send(sitemap);
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin-login/
Disallow: /login
Disallow: /register
Disallow: /profile

Sitemap: https://exidealers.com/sitemap.xml`);
});

// Verify token endpoint
app.get('/api/verify-token', (req, res) => {
    const token = req.headers['admin-token'];
    if (token && token === process.env.ADMIN_SECRET) {
        return res.json({ status: 'valid' });
    }
    res.status(403).json({ error: 'Invalid admin token' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
    console.log(`🔐 User Login: http://localhost:${PORT}/login`);
    console.log(`👤 Dealer Login: http://localhost:${PORT}/dealer-login`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    
    console.log(`📁 Base directory: ${baseDir}`);
    console.log(`📁 Client path: ${path.join(baseDir, 'client')}`);
    console.log(`📁 Server path: ${__dirname}`);
    console.log(`🎨 EJS Views path: ${path.join(__dirname, '../client/views')}`);
});