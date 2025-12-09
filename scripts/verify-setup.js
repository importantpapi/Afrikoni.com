/**
 * Setup Verification Script
 * Run this to verify your production setup is complete
 * 
 * Usage: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Afrikoni Marketplace - Setup Verification\n');
console.log('=' .repeat(50));
console.log('');

let allGood = true;

// Check environment variables
console.log('📋 Environment Variables:');
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

const optionalVars = [
  'VITE_GA4_ID',
  'VITE_SENTRY_DSN'
];

requiredVars.forEach(varName => {
  if (envContent.includes(varName)) {
    console.log(`  ✅ ${varName}`);
  } else {
    console.log(`  ❌ ${varName} - MISSING (Required)`);
    allGood = false;
  }
});

optionalVars.forEach(varName => {
  if (envContent.includes(varName)) {
    console.log(`  ✅ ${varName} (Optional)`);
  } else {
    console.log(`  ⚠️  ${varName} - Not set (Optional)`);
  }
});

console.log('');

// Check OG image
console.log('🖼️  SEO Assets:');
const ogImagePath = path.join(process.cwd(), 'public', 'og-image.png');
const ogImageSvgPath = path.join(process.cwd(), 'public', 'og-image.svg');

if (fs.existsSync(ogImagePath)) {
  console.log('  ✅ og-image.png exists');
} else if (fs.existsSync(ogImageSvgPath)) {
  console.log('  ✅ og-image.svg exists (PNG recommended)');
} else {
  console.log('  ⚠️  og-image.png - Not found (Recommended)');
}

// Check robots.txt
const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
if (fs.existsSync(robotsPath)) {
  console.log('  ✅ robots.txt exists');
} else {
  console.log('  ❌ robots.txt - MISSING');
  allGood = false;
}

// Check sitemap route
console.log('');
console.log('🗺️  Sitemap:');
const sitemapPath = path.join(process.cwd(), 'src', 'pages', 'sitemap.xml.jsx');
if (fs.existsSync(sitemapPath)) {
  console.log('  ✅ sitemap.xml.jsx exists');
} else {
  console.log('  ❌ sitemap.xml.jsx - MISSING');
  allGood = false;
}

// Check build
console.log('');
console.log('🏗️  Build Status:');
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('  ✅ dist/ folder exists (run: npm run build)');
} else {
  console.log('  ℹ️  dist/ folder not found (run: npm run build)');
}

console.log('');
console.log('=' .repeat(50));
console.log('');

if (allGood) {
  console.log('✅ All required checks passed!');
  console.log('');
  console.log('📝 Remaining Manual Tasks:');
  console.log('  1. Verify environment variables in Vercel');
  console.log('  2. Enable leaked password protection in Supabase');
  console.log('  3. Convert og-image.svg to og-image.png (1200x630px)');
  console.log('  4. Submit sitemap to Google Search Console');
  console.log('');
  console.log('🚀 You\'re ready for production!');
} else {
  console.log('⚠️  Some required items are missing.');
  console.log('Please fix the issues above before deploying.');
}

console.log('');

