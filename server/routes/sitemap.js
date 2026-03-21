const express = require('express');
const router = express.Router();
const { Car } = require('../models');

router.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    
    // Base URL - CHANGE THIS TO YOUR DOMAIN
    const BASE_URL = 'https://exidealers.com';
    
    // Static pages
    const staticPages = [
        { url: '/', priority: 1.0, changefreq: 'daily' },
        { url: '/view', priority: 0.9, changefreq: 'hourly' },
        { url: '/contact', priority: 0.7, changefreq: 'monthly' },
        { url: '/login', priority: 0.4, changefreq: 'monthly' },
        { url: '/register', priority: 0.4, changefreq: 'monthly' }
    ];
    
    // Get all cars from database
    const cars = await Car.findAll({
        attributes: ['id', 'make', 'model', 'year', 'location', 'updatedAt']
    });
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Add static pages
    staticPages.forEach(page => {
        sitemap += `
    <url>
        <loc>${BASE_URL}${page.url}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
    });
    
    // Add dynamic car pages with SEO-friendly URLs
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

module.exports = router;