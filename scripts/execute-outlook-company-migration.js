/**
 * Execute Outlook Test Company Migration
 * This script provides instructions and verifies the migration file
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationPath = join(__dirname, '../supabase/migrations/20250123000000_add_outlook_test_company.sql');

console.log('📋 Outlook Test Company Migration\n');
console.log('=' .repeat(60) + '\n');

try {
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('✅ Migration file found and loaded\n');
  console.log('📝 SQL to execute:\n');
  console.log('-'.repeat(60));
  console.log(migrationSQL);
  console.log('-'.repeat(60));
  console.log('\n');

  console.log('🚀 TO EXECUTE THIS MIGRATION:\n');
  console.log('Option 1: Via Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Navigate to: SQL Editor');
  console.log('  4. Click "New query"');
  console.log('  5. Copy and paste the SQL above');
  console.log('  6. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)\n');
  
  console.log('Option 2: Via Supabase CLI (if configured)');
  console.log('  cd supabase/migrations');
  console.log('  supabase db push\n');
  
  console.log('Option 3: Copy the SQL directly:');
  console.log(`  File location: ${migrationPath}\n`);
  
  console.log('✅ This migration will:');
  console.log('  - Create a new company: "Afrikoni Outlook Test Company"');
  console.log('  - Link the profile with email: afrikoni@outlook.com');
  console.log('  - Set the profile role to: seller');
  console.log('  - Set the company_id in the profile\n');

} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

