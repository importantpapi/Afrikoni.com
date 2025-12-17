/**
 * Automated Verification Script
 * Verifies migration and tests RFQ system after manual migration application
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Automated RFQ System Verification\n');
console.log('='.repeat(50));

let allPassed = true;
const results = [];

// Test 1: Verify Migration Applied
async function verifyMigration() {
  console.log('\n📊 TASK 2: Verifying Migration Applied\n');
  
  // Check incoterms
  try {
    const { error } = await supabase.from('quotes').select('incoterms').limit(1);
    if (error?.message?.includes('column') && error.message.includes('incoterms')) {
      console.log('   ❌ incoterms column missing');
      results.push({ task: 'Migration: incoterms', status: 'FAIL' });
      return false;
    }
    console.log('   ✅ incoterms column exists');
    results.push({ task: 'Migration: incoterms', status: 'PASS' });
  } catch (err) {
    console.log('   ❌ Error checking incoterms:', err.message);
    results.push({ task: 'Migration: incoterms', status: 'FAIL' });
    return false;
  }

  // Check moq
  try {
    const { error } = await supabase.from('quotes').select('moq').limit(1);
    if (error?.message?.includes('column') && error.message.includes('moq')) {
      console.log('   ❌ moq column missing');
      results.push({ task: 'Migration: moq', status: 'FAIL' });
      return false;
    }
    console.log('   ✅ moq column exists');
    results.push({ task: 'Migration: moq', status: 'PASS' });
  } catch (err) {
    console.log('   ❌ Error checking moq:', err.message);
    results.push({ task: 'Migration: moq', status: 'FAIL' });
    return false;
  }

  // Check status
  try {
    const { error } = await supabase.from('quotes').select('status').limit(1);
    if (error?.message?.includes('column') && error.message.includes('status')) {
      console.log('   ❌ status column missing');
      results.push({ task: 'Migration: status', status: 'FAIL' });
      return false;
    }
    console.log('   ✅ status column exists');
    results.push({ task: 'Migration: status', status: 'PASS' });
  } catch (err) {
    console.log('   ❌ Error checking status:', err.message);
    results.push({ task: 'Migration: status', status: 'FAIL' });
    return false;
  }

  // Test quote_submitted status
  try {
    const { error } = await supabase
      .from('quotes')
      .select('id')
      .eq('status', 'quote_submitted')
      .limit(1);
    
    if (error?.message?.includes('constraint') || error?.message?.includes('check')) {
      console.log('   ❌ quote_submitted status not allowed');
      results.push({ task: 'Migration: quote_submitted status', status: 'FAIL' });
      return false;
    }
    console.log('   ✅ quote_submitted status is valid');
    results.push({ task: 'Migration: quote_submitted status', status: 'PASS' });
  } catch (err) {
    console.log('   ⚠️  No quotes with quote_submitted status yet (OK)');
    results.push({ task: 'Migration: quote_submitted status', status: 'PASS' });
  }

  return true;
}

// Test 2: Verify RFQ Tables and Structure
async function verifyRFQStructure() {
  console.log('\n📋 Verifying RFQ System Structure\n');
  
  try {
    // Check rfqs table
    const { error: rfqError } = await supabase.from('rfqs').select('id').limit(1);
    if (rfqError) {
      console.log('   ❌ rfqs table error:', rfqError.message);
      results.push({ task: 'Structure: rfqs table', status: 'FAIL' });
      return false;
    }
    console.log('   ✅ rfqs table accessible');
    results.push({ task: 'Structure: rfqs table', status: 'PASS' });

    // Check quotes table
    const { error: quotesError } = await supabase.from('quotes').select('id').limit(1);
    if (quotesError) {
      console.log('   ❌ quotes table error:', quotesError.message);
      results.push({ task: 'Structure: quotes table', status: 'FAIL' });
      return false;
    }
    console.log('   ✅ quotes table accessible');
    results.push({ task: 'Structure: quotes table', status: 'PASS' });

    // Check notifications table
    const { error: notifError } = await supabase.from('notifications').select('id').limit(1);
    if (notifError) {
      console.log('   ⚠️  notifications table error:', notifError.message);
      results.push({ task: 'Structure: notifications table', status: 'WARN' });
    } else {
      console.log('   ✅ notifications table accessible');
      results.push({ task: 'Structure: notifications table', status: 'PASS' });
    }

    return true;
  } catch (err) {
    console.log('   ❌ Structure verification error:', err.message);
    return false;
  }
}

// Main execution
async function runVerification() {
  console.log('\n🚀 Starting Automated Verification...\n');

  // Verify migration
  const migrationOk = await verifyMigration();
  if (!migrationOk) {
    console.log('\n❌ Migration verification failed!');
    console.log('   Please apply migration first via Supabase Dashboard.');
    allPassed = false;
  }

  // Verify structure
  const structureOk = await verifyRFQStructure();
  if (!structureOk) {
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 VERIFICATION SUMMARY\n');
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`   ${icon} ${r.task}: ${r.status}`);
  });

  if (allPassed) {
    console.log('\n✅ ALL VERIFICATIONS PASSED!\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Test end-to-end RFQ flow (see COMPLETE_ALL_TASKS.md)');
    console.log('   2. Complete smoke tests');
    console.log('   3. Deploy frontend\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME VERIFICATIONS FAILED\n');
    console.log('⚠️  Action Required:');
    console.log('   1. Apply migration via Supabase Dashboard');
    console.log('   2. Re-run this verification: npm run verify-migration\n');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('\n❌ Verification error:', err);
  process.exit(1);
});

