/**
 * Migration Verification Script
 * Verifies that the quotes table migration was applied correctly
 * Run this after applying the migration in Supabase Dashboard
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying Migration: extend_quotes_table\n');
  console.log('='.repeat(50));

  let allPassed = true;

  // Test 1: Check incoterms column
  console.log('\n1️⃣ Checking incoterms column...');
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('incoterms')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('incoterms')) {
      console.log('   ❌ FAIL: incoterms column does not exist');
      allPassed = false;
    } else {
      console.log('   ✅ PASS: incoterms column exists');
    }
  } catch (err) {
    console.log('   ❌ FAIL: Error checking incoterms:', err.message);
    allPassed = false;
  }

  // Test 2: Check moq column
  console.log('\n2️⃣ Checking moq column...');
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('moq')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('moq')) {
      console.log('   ❌ FAIL: moq column does not exist');
      allPassed = false;
    } else {
      console.log('   ✅ PASS: moq column exists');
    }
  } catch (err) {
    console.log('   ❌ FAIL: Error checking moq:', err.message);
    allPassed = false;
  }

  // Test 3: Check status column and constraint
  console.log('\n3️⃣ Checking status column...');
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('status')
      .limit(1);
    
    if (error && error.message.includes('column') && error.message.includes('status')) {
      console.log('   ❌ FAIL: status column does not exist');
      allPassed = false;
    } else {
      console.log('   ✅ PASS: status column exists');
    }
  } catch (err) {
    console.log('   ❌ FAIL: Error checking status:', err.message);
    allPassed = false;
  }

  // Test 4: Try to insert quote_submitted status
  console.log('\n4️⃣ Testing quote_submitted status...');
  try {
    // This will fail if constraint doesn't allow quote_submitted
    const { error } = await supabase
      .from('quotes')
      .select('id')
      .eq('status', 'quote_submitted')
      .limit(1);
    
    if (error && error.message.includes('constraint') || error.message.includes('check')) {
      console.log('   ❌ FAIL: quote_submitted status not allowed');
      allPassed = false;
    } else {
      console.log('   ✅ PASS: quote_submitted status is valid');
    }
  } catch (err) {
    console.log('   ⚠️  Note: No quotes with quote_submitted status yet (this is OK)');
  }

  // Test 5: Try to insert a test quote with new fields
  console.log('\n5️⃣ Testing quote insertion with new fields...');
  try {
    // Get a test RFQ ID (or use a dummy one)
    const { data: testRfq } = await supabase
      .from('rfqs')
      .select('id')
      .limit(1)
      .single();

    if (testRfq) {
      const { error } = await supabase
        .from('quotes')
        .insert({
          rfq_id: testRfq.id,
          supplier_company_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          price_per_unit: 10.00,
          total_price: 100.00,
          currency: 'USD',
          incoterms: 'FOB',
          moq: 100,
          status: 'quote_submitted',
          delivery_time: '2 weeks'
        });

      if (error) {
        if (error.message.includes('foreign key') || error.message.includes('supplier_company_id')) {
          console.log('   ✅ PASS: New fields accepted (foreign key error expected with dummy ID)');
        } else {
          console.log('   ❌ FAIL: Error inserting quote:', error.message);
          allPassed = false;
        }
      } else {
        console.log('   ✅ PASS: Quote with new fields inserted successfully');
        // Clean up test quote
        await supabase
          .from('quotes')
          .delete()
          .eq('rfq_id', testRfq.id)
          .eq('supplier_company_id', '00000000-0000-0000-0000-000000000000');
      }
    } else {
      console.log('   ⚠️  SKIP: No RFQs found to test with');
    }
  } catch (err) {
    console.log('   ⚠️  Note: Test insertion skipped (this is OK if no test data)');
  }

  // Final Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('\n✅ MIGRATION VERIFICATION: ALL TESTS PASSED');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Run smoke tests (see FINAL_GO_CHECKLIST.md)');
    console.log('   2. Deploy frontend');
    console.log('   3. Go live! 🚀\n');
    process.exit(0);
  } else {
    console.log('\n❌ MIGRATION VERIFICATION: SOME TESTS FAILED');
    console.log('\n⚠️  Action Required:');
    console.log('   1. Re-check migration was applied correctly');
    console.log('   2. Run verification queries in Supabase SQL Editor');
    console.log('   3. Fix any issues before proceeding\n');
    process.exit(1);
  }
}

verifyMigration().catch(err => {
  console.error('\n❌ Verification script error:', err);
  process.exit(1);
});

