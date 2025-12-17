/**
 * Verify Metadata Migration Applied
 * Checks if rfqs.metadata column exists
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying Metadata Migration\n');
console.log('='.repeat(50));

async function verifyMetadata() {
  try {
    // Try to select metadata column
    const { data, error } = await supabase
      .from('rfqs')
      .select('metadata')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('metadata')) {
        console.log('❌ metadata column: NOT FOUND');
        console.log('\n⚠️  Migration not yet applied.');
        console.log('   Apply via Supabase Dashboard SQL Editor.\n');
        return false;
      } else {
        console.log('⚠️  Error checking metadata:', error.message);
        return false;
      }
    } else {
      console.log('✅ metadata column: EXISTS');
      console.log('✅ Migration applied successfully!\n');
      
      // Try to verify it's JSONB
      if (data && data.length > 0 && data[0].metadata !== undefined) {
        const isObject = typeof data[0].metadata === 'object';
        console.log(`✅ Column type: ${isObject ? 'JSONB (working)' : 'Other'}`);
      }
      
      return true;
    }
  } catch (err) {
    console.log('❌ Verification error:', err.message);
    return false;
  }
}

verifyMetadata().then(passed => {
  if (passed) {
    console.log('\n✅ Metadata migration verified!\n');
    console.log('🎯 All migrations complete.\n');
    process.exit(0);
  } else {
    console.log('\n⏳ Waiting for migration to be applied...\n');
    process.exit(1);
  }
});

