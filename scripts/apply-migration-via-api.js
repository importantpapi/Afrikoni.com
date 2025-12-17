/**
 * Apply Migration via Supabase API
 * Attempts to execute the migration SQL using Supabase REST API
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
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nNote: Service role key is required for migrations.');
  console.error('You can find it in Supabase Dashboard → Settings → API → service_role key\n');
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
    console.log('🚀 Attempting to apply migration via API...\n');
    console.log('⚠️  Note: Direct SQL execution via API may not be available.');
    console.log('   If this fails, use Supabase Dashboard SQL Editor instead.\n');

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20250116000000_extend_quotes_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Migration file loaded\n');

    // Try to execute via RPC (requires exec_sql function in Supabase)
    console.log('⏳ Attempting to execute migration...\n');

    // Note: This requires a custom function in Supabase
    // Most Supabase instances don't have direct SQL execution via API for security
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    }).catch(async (err) => {
      // If RPC doesn't exist, try alternative approach
      console.log('⚠️  Direct SQL execution not available via API.');
      console.log('   This is expected - Supabase doesn\'t allow direct SQL via API for security.\n');
      return { error: { message: 'Use Supabase Dashboard SQL Editor' } };
    });

    if (error) {
      if (error.message.includes('exec_sql') || error.message.includes('not available') || error.message.includes('Dashboard')) {
        console.log('📋 MIGRATION MUST BE APPLIED MANUALLY\n');
        console.log('Steps:');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Navigate to SQL Editor');
        console.log('4. Copy and paste the migration SQL from:');
        console.log(`   ${migrationPath}`);
        console.log('5. Click "Run"\n');
        console.log('After applying, run: npm run verify-migration\n');
        return;
      }
      throw error;
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('📊 Verifying...\n');
    
    // Verify migration
    await verifyMigration();

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Use Supabase Dashboard SQL Editor to apply migration manually.');
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  // Test 1: Check incoterms column
  try {
    const { error } = await supabase
      .from('quotes')
      .select('incoterms')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('incoterms')) {
      console.log('❌ incoterms column does not exist');
      return false;
    } else {
      console.log('✅ incoterms column exists');
    }
  } catch (err) {
    console.log('⚠️  Could not verify incoterms column');
  }

  // Test 2: Check moq column
  try {
    const { error } = await supabase
      .from('quotes')
      .select('moq')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('moq')) {
      console.log('❌ moq column does not exist');
      return false;
    } else {
      console.log('✅ moq column exists');
    }
  } catch (err) {
    console.log('⚠️  Could not verify moq column');
  }

  // Test 3: Check status column
  try {
    const { error } = await supabase
      .from('quotes')
      .select('status')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('status')) {
      console.log('❌ status column does not exist');
      return false;
    } else {
      console.log('✅ status column exists');
    }
  } catch (err) {
    console.log('⚠️  Could not verify status column');
  }

  console.log('\n✅ Verification complete!\n');
  return true;
}

applyMigration();

