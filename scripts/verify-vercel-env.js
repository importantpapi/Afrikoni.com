/**
 * Vercel Environment Variables Verification Helper
 * 
 * This script helps verify that all required environment variables are set in Vercel
 * 
 * Usage: node scripts/verify-vercel-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Vercel Environment Variables Verification\n');
console.log('=' .repeat(60));
console.log('');

// Read local .env file
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📋 Reading from: .env\n');
} else if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('📋 Reading from: .env.local\n');
} else {
  console.error('❌ No .env or .env.local file found');
  process.exit(1);
}

// Extract VITE_ variables
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

console.log('📝 Required Variables (must be in Vercel):');
console.log('');
requiredVars.forEach(varName => {
  const isSet = envContent.includes(varName);
  const value = envContent.split('\n').find(line => line.startsWith(varName + '='));
  const displayValue = value ? (value.split('=')[1] || '').substring(0, 30) + '...' : 'Not set';
  
  console.log(`   ${isSet ? '✅' : '❌'} ${varName}`);
  if (isSet) {
    console.log(`      Local value: ${displayValue}`);
  }
});
console.log('');

console.log('📝 Optional Variables (recommended for Vercel):');
console.log('');
optionalVars.forEach(varName => {
  const isSet = envContent.includes(varName);
  const value = envContent.split('\n').find(line => line.startsWith(varName + '='));
  const displayValue = value ? (value.split('=')[1] || '').substring(0, 30) + '...' : 'Not set';
  
  console.log(`   ${isSet ? '✅' : '⚠️'} ${varName}`);
  if (isSet) {
    console.log(`      Local value: ${displayValue}`);
  }
});
console.log('');

console.log('=' .repeat(60));
console.log('');
console.log('📋 Next Steps:');
console.log('');
console.log('1. Go to Vercel Dashboard:');
console.log('   https://vercel.com/dashboard');
console.log('');
console.log('2. Select your project (Afrikoni)');
console.log('');
console.log('3. Navigate to:');
console.log('   Settings → Environment Variables');
console.log('');
console.log('4. For each variable above:');
console.log('   - Check if it exists in Vercel');
console.log('   - If missing, click "Add New"');
console.log('   - Enter the variable name');
console.log('   - Enter the variable value (from local .env)');
console.log('   - Select environments: Production, Preview, Development');
console.log('   - Click "Save"');
console.log('');
console.log('5. After adding all variables:');
console.log('   - Redeploy your project (or wait for next deployment)');
console.log('   - Variables will be available in production');
console.log('');
console.log('💡 Tip: You can use Vercel CLI to add variables:');
console.log('   vercel env add VITE_SUPABASE_URL production');
console.log('');

