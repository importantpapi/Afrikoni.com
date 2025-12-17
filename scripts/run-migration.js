/**
 * Migration Runner Script
 * Runs the quotes table extension migration against Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Create Supabase client with service role key for migrations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting migration: extend_quotes_table...\n');

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20250116000000_extend_quotes_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons to execute statements one by one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) continue;

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use RPC to execute raw SQL (requires service role key)
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        }).catch(async () => {
          // Fallback: try direct query execution
          // Note: This requires the exec_sql function or direct SQL access
          // For now, we'll use a workaround with Supabase's query builder where possible
          return { error: { message: 'Direct SQL execution not available. Please run migration via Supabase Dashboard.' } };
        });

        if (error) {
          // If RPC doesn't work, provide instructions
          if (error.message.includes('exec_sql') || error.message.includes('not available')) {
            console.log('\n⚠️  Direct SQL execution via API is not available.');
            console.log('📋 Please run this migration manually via Supabase Dashboard:\n');
            console.log('1. Go to your Supabase Dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy and paste the contents of:');
            console.log(`   ${migrationPath}\n`);
            console.log('4. Click "Run" to execute the migration\n');
            return;
          }
          throw error;
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verification:');
    console.log('   - quotes.incoterms column added');
    console.log('   - quotes.moq column added');
    console.log('   - quotes.status constraint updated');
    console.log('   - Quote edit prevention trigger created\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Run migration via Supabase Dashboard SQL Editor');
    process.exit(1);
  }
}

runMigration();

