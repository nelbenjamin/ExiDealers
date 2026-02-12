const express = require('express');
const app = express();
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');


// Remove CSP headers that Railway adds
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

// OPTIMIZED PAYLOAD SIZE LIMITS
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ 
  limit: '100mb', 
  extended: true,
  parameterLimit: 50000
}));


// Get the correct base directory path
const baseDir = path.join(__dirname, '..');

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(baseDir, 'client')));
app.use(express.static(path.join(__dirname, 'public')));

// Serve styles.css from the correct location
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


// API Routes
app.use('/api/cars', require('./routes/cars'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/price-alerts', require('./routes/priceAlerts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/car-enquiries', require('./routes/carEnquiries'));


// Verify token endpoint
app.get('/api/verify-token', (req, res) => {
    const token = req.headers['admin-token'];
    if (token && token === process.env.ADMIN_SECRET) {
        return res.json({ status: 'valid' });
    }
    res.status(403).json({ error: 'Invalid admin token' });
});



// Admin login route
app.get('/admin', (req, res) => {
    const adminLoginPath = path.join(__dirname, 'public', 'admin-login.html');
    if (fs.existsSync(adminLoginPath)) {
        res.sendFile(adminLoginPath);
    } else {
        res.status(404).send('Admin login page not found');
    }
});

// Protected admin dashboard route
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

// Serve admin.html directly
app.get('/admin.html', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.status(404).send('Admin page not found');
    }
});

// USER AUTHENTICATION PAGES
app.get('/login', (req, res) => {
    const loginPath = path.join(baseDir, 'client', 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.status(404).send('Login page not found. Path: ' + loginPath);
    }
});


// CLIENT PAGE ROUTES
app.get('/', (req, res) => {
    const indexPath = path.join(baseDir, 'client', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Home page not found. Path: ' + indexPath);
    }
});

app.get('/view', (req, res) => {
    const viewPath = path.join(baseDir, 'client', 'view.html');
    if (fs.existsSync(viewPath)) {
        res.sendFile(viewPath);
    } else {
        res.status(404).send('View page not found. Path: ' + viewPath);
    }
});

app.get('/contact', (req, res) => {
    const contactPath = path.join(baseDir, 'client', 'contact.html');
    if (fs.existsSync(contactPath)) {
        res.sendFile(contactPath);
    } else {
        res.status(404).send('Contact page not found. Path: ' + contactPath);
    }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(cookieParser());

// Add auth routes - add this with your other route declarations
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/user/favorites', require('./routes/userFavorites'));
app.use('/api/user/saved', require('./routes/userSaved'));
app.use('/api/user/alerts', require('./routes/userAlerts'));

// Add route for profile page
app.get('/profile', (req, res) => {
    const profilePath = path.join(baseDir, 'client', 'profile.html');
    if (fs.existsSync(profilePath)) {
        res.sendFile(profilePath);
    } else {
        res.status(404).send('Profile page not found');
    }
});

// Add route for register page
app.get('/register', (req, res) => {
    const registerPath = path.join(baseDir, 'client', 'register.html');
    if (fs.existsSync(registerPath)) {
        res.sendFile(registerPath);
    } else {
        res.status(404).send('Register page not found');
    }
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
    console.log(`👤 User Register: http://localhost:${PORT}/register`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 Session Test: http://localhost:${PORT}/api/test-session`);
    console.log(`🔍 Auth Status: http://localhost:${PORT}/api/auth/status`);
    
    console.log(`📁 Base directory: ${baseDir}`);
    console.log(`📁 Client path: ${path.join(baseDir, 'client')}`);
    console.log(`📁 Server path: ${__dirname}`);
    
    // Log memory usage and limits
    console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`📸 Max files per upload: 40`);
    console.log(`💿 Max file size: 20MB`);
    console.log(`📦 Max request size: 100MB`);
});