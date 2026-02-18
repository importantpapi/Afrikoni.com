/**
 * AFRIKONI SITEMAP GENERATOR
 * Generates sitemap.xml with alternate links for all supported languages.
 * 
 * Usage: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://afrikoni.com';
const LANGUAGES = ['en', 'fr', 'pt', 'ar'];

// Core pages (add more dynamic routes as needed)
const PAGES = [
    '',
    '/marketplace',
    '/suppliers',
    '/categories',
    '/about',
    '/contact'
];

// Placeholder for dynamic fetching (e.g., from Supabase)
// In a real scenario, you'd fetch product IDs here
const PRODUCT_IDS = ['prod-1', 'prod-2', 'prod-3']; // Example

const generateSitemap = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    // 1. Static Pages
    PAGES.forEach(page => {
        LANGUAGES.forEach(lang => {
            xml += `
  <url>
    <loc>${BASE_URL}/${lang}${page}</loc>
    ${LANGUAGES.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${page}"/>`).join('\n    ')}
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        });
    });

    // 2. Dynamic Products (Example)
    PRODUCT_IDS.forEach(id => {
        LANGUAGES.forEach(lang => {
            xml += `
  <url>
    <loc>${BASE_URL}/${lang}/product/${id}</loc>
    ${LANGUAGES.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}/product/${id}"/>`).join('\n    ')}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
        });
    });

    xml += `
</urlset>`;

    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    console.log('✅ Sitemap generated at public/sitemap.xml');
};

generateSitemap();
