/**
 * Apply Kernel Migrations via Supabase API
 * Note: Direct SQL execution via API is limited, but we can verify and guide
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wmjxiazhvjaadzdsroqa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MIGRATIONS = [
  {
    name: 'Optimize Subscriptions RLS',
    file: 'supabase/migrations/20260121_optimize_subscriptions_rls.sql',
    priority: 1
  },
  {
    name: 'Kernel Backend Final Alignment',
    file: 'supabase/migrations/20260121_kernel_backend_final_alignment.sql',
    priority: 2
  }
];

async function checkCurrentState() {
  console.log('🔍 Checking Current Backend State...\n');
  
  // Check functions
  console.log('📋 Checking Functions:');
  
  try {
    const { error: err1 } = await supabase.rpc('current_company_id');
    if (err1 && err1.message.includes('does not exist')) {
      console.log('   ❌ current_company_id() - NOT FOUND');
    } else {
      console.log('   ✅ current_company_id() - EXISTS');
    }
  } catch (e) {
    console.log('   ⚠️  current_company_id() - Cannot verify (needs auth context)');
  }
  
  try {
    const { error: err2 } = await supabase.rpc('is_admin');
    if (err2 && err2.message.includes('does not exist')) {
      console.log('   ❌ is_admin() - NOT FOUND');
    } else {
      console.log('   ✅ is_admin() - EXISTS');
    }
  } catch (e) {
    console.log('   ⚠️  is_admin() - Cannot verify (needs auth context)');
  }
  
  console.log();
}

async function displayMigrations() {
  console.log('📋 Migrations to Apply:\n');
  
  for (const migration of MIGRATIONS) {
    const filePath = join(__dirname, '..', migration.file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const size = (content.length / 1024).toFixed(2);
      
      console.log(`${migration.priority}. ${migration.name}`);
      console.log(`   File: ${migration.file}`);
      console.log(`   Size: ${size} KB (${lines} lines)`);
      console.log();
    } catch (error) {
      console.log(`   ❌ File not found: ${migration.file}`);
      console.log();
    }
  }
}

async function main() {
  console.log('🚀 Kernel Backend Migration Application');
  console.log('='.repeat(60));
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log();
  
  // Check current state
  await checkCurrentState();
  
  // Display migrations
  await displayMigrations();
  
  console.log('⚠️  IMPORTANT: Direct SQL Execution via API Not Available');
  console.log('   Supabase REST API does not support DDL statements (CREATE, ALTER, DROP)');
  console.log('   for security reasons.\n');
  
  console.log('📋 MANUAL APPLICATION REQUIRED:');
  console.log('='.repeat(60));
  console.log();
  console.log('🔗 Open Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new`);
  console.log();
  
  for (const migration of MIGRATIONS) {
    const filePath = join(__dirname, '..', migration.file);
    console.log(`📝 Migration ${migration.priority}: ${migration.name}`);
    console.log(`   File: ${migration.file}`);
    console.log(`   Steps:`);
    console.log(`   1. Copy contents of: ${filePath}`);
    console.log(`   2. Paste into SQL Editor`);
    console.log(`   3. Click "Run"`);
    console.log(`   4. Wait for: "Success. No rows returned."`);
    console.log();
  }
  
  console.log('✅ After applying both migrations:');
  console.log('   Run: npm run verify-backend');
  console.log();
}

main().catch(console.error);
