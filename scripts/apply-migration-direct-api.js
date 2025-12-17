/**
 * Attempt Direct Migration via Supabase Management API
 * Uses service role key to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('\nTo get service role key:');
  console.error('1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/settings/api');
  console.error('2. Copy "service_role" key (secret)');
  console.error('3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Attempting to apply migration via Management API...\n');

    const migrationPath = join(__dirname, '../supabase/migrations/20250116000000_extend_quotes_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration SQL loaded\n');

    // Supabase REST API doesn't support direct DDL execution
    // We need to use the Management API or PostgREST extensions
    // Let's try using RPC if a function exists, or provide clear instructions

    console.log('⚠️  Direct SQL execution via REST API is not supported by Supabase.');
    console.log('   DDL statements (ALTER TABLE, CREATE FUNCTION, etc.) must be executed');
    console.log('   via the Dashboard SQL Editor or via direct database connection.\n');

    console.log('📋 MIGRATION MUST BE APPLIED MANUALLY:\n');
    console.log('🔗 Direct Link to SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new\n`);
    console.log('📝 Steps:');
    console.log('   1. Click the link above');
    console.log('   2. Copy ALL contents from:');
    console.log(`      ${migrationPath}`);
    console.log('   3. Paste into SQL Editor');
    console.log('   4. Click "Run" button');
    console.log('   5. Verify: "Success. No rows returned."\n');
    console.log('After applying, run: npm run check-all\n');

    // But let's verify current state
    console.log('🔍 Checking current database state...\n');

    const checks = [
      { name: 'incoterms', field: 'incoterms' },
      { name: 'moq', field: 'moq' },
      { name: 'status', field: 'status' }
    ];

    for (const check of checks) {
      try {
        const { error } = await supabase
          .from('quotes')
          .select(check.field)
          .limit(1);

        if (error?.message?.includes('column') && error.message.includes(check.field)) {
          console.log(`   ❌ ${check.name} column: MISSING`);
        } else {
          console.log(`   ✅ ${check.name} column: EXISTS`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${check.name} column: Cannot verify`);
      }
    }

    console.log('\n💡 After applying migration manually, all columns should show ✅\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();

