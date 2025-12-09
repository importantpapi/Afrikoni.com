/**
 * Production Readiness Checker
 * 
 * This script verifies all production requirements are met
 * 
 * Usage: node scripts/check-production-readiness.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Afrikoni Marketplace - Production Readiness Check\n');
console.log('=' .repeat(60));
console.log('');

let allChecks = [];
let passed = 0;
let warnings = 0;
let failed = 0;

function check(name, condition, message, isWarning = false) {
  if (condition) {
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
    allChecks.push({ name, status: 'pass', message });
    passed++;
  } else {
    const prefix = isWarning ? '⚠️' : '❌';
    console.log(`${prefix} ${name}`);
    if (message) console.log(`   ${message}`);
    allChecks.push({ name, status: isWarning ? 'warning' : 'fail', message });
    if (isWarning) warnings++;
    else failed++;
  }
  console.log('');
}

// 1. Check build
console.log('📦 Build Status:');
const distPath = path.join(process.cwd() || __dirname.replace('/scripts', ''), 'dist');
check(
  'Build directory exists',
  fs.existsSync(distPath),
  distPath,
  false
);

// 2. Check environment variables
console.log('🔐 Environment Variables:');
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
}

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_FLW_PUBLIC_KEY',
  'VITE_WHATSAPP_COMMUNITY_LINK'
];

requiredVars.forEach(varName => {
  check(
    varName,
    envContent.includes(varName),
    envContent.includes(varName) ? 'Set' : 'Missing (Required)',
    false
  );
});

const optionalVars = [
  'VITE_GA4_ID',
  'VITE_SENTRY_DSN'
];

optionalVars.forEach(varName => {
  check(
    varName,
    true, // Always pass, just checking if set
    envContent.includes(varName) ? 'Set' : 'Not set (Optional)',
    true
  );
});

// 3. Check SEO assets
console.log('🔍 SEO Assets:');
const ogImagePng = path.join(process.cwd(), 'public', 'og-image.png');
const ogImageSvg = path.join(process.cwd(), 'public', 'og-image.svg');

check(
  'OG Image (PNG)',
  fs.existsSync(ogImagePng),
  fs.existsSync(ogImagePng) ? 'Found' : 'Not found (SVG exists, PNG recommended)',
  !fs.existsSync(ogImagePng) && fs.existsSync(ogImageSvg)
);

check(
  'OG Image (SVG)',
  fs.existsSync(ogImageSvg),
  fs.existsSync(ogImageSvg) ? 'Found' : 'Missing',
  false
);

const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
check(
  'robots.txt',
  fs.existsSync(robotsPath),
  fs.existsSync(robotsPath) ? 'Found' : 'Missing',
  false
);

const sitemapPath = path.join(process.cwd(), 'src', 'pages', 'sitemap.xml.jsx');
check(
  'Sitemap route',
  fs.existsSync(sitemapPath),
  fs.existsSync(sitemapPath) ? 'Found' : 'Missing',
  false
);

// 4. Check Vercel config
console.log('⚙️  Configuration:');
const vercelPath = path.join(process.cwd(), 'vercel.json');
check(
  'vercel.json',
  fs.existsSync(vercelPath),
  fs.existsSync(vercelPath) ? 'Found' : 'Missing (Recommended)',
  true
);

// 5. Check package.json scripts
console.log('📜 Scripts:');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  check(
    'Build script',
    !!scripts.build,
    scripts.build || 'Missing',
    false
  );
  
  check(
    'Start script',
    !!scripts.start || !!scripts.dev,
    scripts.start || scripts.dev || 'Missing',
    true
  );
}

// 6. Check critical files
console.log('📁 Critical Files:');
const criticalFiles = [
  { path: 'src/App.jsx', name: 'App.jsx' },
  { path: 'src/main.jsx', name: 'main.jsx' },
  { path: 'index.html', name: 'index.html' },
  { path: 'vite.config.js', name: 'vite.config.js' }
];

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  check(
    file.name,
    fs.existsSync(filePath),
    fs.existsSync(filePath) ? 'Found' : 'Missing',
    false
  );
});

// Summary
console.log('=' .repeat(60));
console.log('');
console.log('📊 Summary:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   ❌ Failed: ${failed}`);
console.log('');

if (failed === 0) {
  console.log('🎉 All critical checks passed!');
  console.log('');
  console.log('📝 Remaining Manual Tasks:');
  console.log('   1. Convert OG image to PNG (if not done)');
  console.log('   2. Verify Vercel environment variables');
  console.log('   3. Enable leaked password protection in Supabase');
  console.log('   4. Submit sitemap to Google Search Console');
  console.log('');
  console.log('🚀 You\'re ready for production!');
} else {
  console.log('⚠️  Some critical checks failed.');
  console.log('Please fix the issues above before deploying.');
}

console.log('');

