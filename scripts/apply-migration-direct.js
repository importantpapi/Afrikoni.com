/**
 * Direct Migration Application via Supabase Management API
 * Attempts to apply migration using service role key
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key\n');
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
    console.log('🚀 Attempting to apply migration directly...\n');

    const migrationPath = join(__dirname, '../supabase/migrations/20250116000000_extend_quotes_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Try to execute via PostgREST (won't work for DDL, but let's try)
    // Actually, we need to use the Management API or direct connection
    // For now, we'll verify what we can and provide clear instructions

    console.log('⚠️  Direct SQL execution via API is not possible.');
    console.log('   Supabase REST API does not support DDL statements (ALTER TABLE, etc.)\n');
    console.log('📋 MIGRATION MUST BE APPLIED MANUALLY:\n');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select project');
    console.log('3. SQL Editor → New query');
    console.log(`4. Copy from: ${migrationPath}`);
    console.log('5. Paste and Run\n');

    // But let's try to verify current state and apply what we can
    console.log('🔍 Checking current database state...\n');

    // Check if columns already exist
    const { error: incotermsError } = await supabase
      .from('quotes')
      .select('incoterms')
      .limit(1);

    if (!incotermsError || !incotermsError.message.includes('column')) {
      console.log('✅ incoterms column may already exist');
    } else {
      console.log('❌ incoterms column missing - migration needed');
    }

    const { error: moqError } = await supabase
      .from('quotes')
      .select('moq')
      .limit(1);

    if (!moqError || !moqError.message.includes('column')) {
      console.log('✅ moq column may already exist');
    } else {
      console.log('❌ moq column missing - migration needed');
    }

    console.log('\n💡 Since direct DDL is not possible, please apply migration manually.');
    console.log('   After applying, run: npm run verify-migration\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();

