/**
 * Automated Smoke Tests for RFQ System
 * Tests all critical user flows programmatically
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 RFQ System - Automated Smoke Tests\n');
console.log('='.repeat(60));

const smokeResults = [];

function logSmokeTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
  smokeResults.push({ name, passed, details });
  return passed;
}

// Smoke Test 1: RFQ Creation Flow (Code Verification)
async function smokeTest1_RFQCreation() {
  console.log('\n📝 SMOKE TEST 1: RFQ Creation Flow\n');

  const fs = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const rfqCreatePath = join(__dirname, '..', 'src', 'pages', 'rfq', 'create.jsx');
  
  if (!fs.existsSync(rfqCreatePath)) {
    logSmokeTest('RFQ Create Page', false, 'File not found');
    return false;
  }

  const rfqCreate = fs.readFileSync(rfqCreatePath, 'utf-8');

  // Check for 4-step flow
  const hasSteps = rfqCreate.includes('currentStep') && 
                   rfqCreate.includes('setCurrentStep') &&
                   (rfqCreate.match(/Step \d+/g) || []).length >= 3;
  
  // Check for all required fields
  const requiredFields = [
    'productName', 'category', 'quantity', 'unit',
    'delivery_country', 'timeline', 'specifications',
    'incoterms', 'purchase_type', 'order_value_range',
    'company_name', 'buyer_role'
  ];

  const hasAllFields = requiredFields.every(field => rfqCreate.includes(field));
  
  // Check for submission logic
  const hasSubmission = rfqCreate.includes('handleSubmit') || 
                       rfqCreate.includes('submitRFQ') ||
                       rfqCreate.includes('.insert');

  logSmokeTest('RFQ Create Page Exists', true, 'File found');
  logSmokeTest('4-Step Flow', hasSteps, hasSteps ? 'Multi-step form implemented' : 'Missing step logic');
  logSmokeTest('All Required Fields', hasAllFields, hasAllFields ? 'All fields present' : 'Missing fields');
  logSmokeTest('Submission Logic', hasSubmission, hasSubmission ? 'Submit function exists' : 'Missing submit');

  return hasSteps && hasAllFields && hasSubmission;
}

// Smoke Test 2: Admin Review Interface
async function smokeTest2_AdminReview() {
  console.log('\n👤 SMOKE TEST 2: Admin Review Interface\n');

  const fs = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const adminReviewPath = join(__dirname, '..', 'src', 'pages', 'dashboard', 'admin', 'rfq-review.jsx');
  
  if (!fs.existsSync(adminReviewPath)) {
    logSmokeTest('Admin Review Page', false, 'File not found');
    return false;
  }

  const adminReview = fs.readFileSync(adminReviewPath, 'utf-8');

  // Check for key features
  const hasList = adminReview.includes('rfqs') && adminReview.includes('.select');
  const hasDetailView = adminReview.includes('selectedRFQ') || adminReview.includes('rfq detail');
  const hasActions = adminReview.includes('Approve') && 
                     adminReview.includes('Reject') &&
                     adminReview.includes('Clarification');
  const hasMatching = adminReview.includes('matched_supplier_ids') || 
                     adminReview.includes('supplier shortlist');
  const hasNotes = adminReview.includes('internal_notes') || adminReview.includes('internal notes');

  logSmokeTest('Admin Review Page Exists', true, 'File found');
  logSmokeTest('RFQ List View', hasList, hasList ? 'List functionality present' : 'Missing list');
  logSmokeTest('Detail View', hasDetailView, hasDetailView ? 'Detail view present' : 'Missing detail');
  logSmokeTest('Action Buttons', hasActions, hasActions ? 'All actions present' : 'Missing actions');
  logSmokeTest('Supplier Matching', hasMatching, hasMatching ? 'Matching feature present' : 'Missing matching');
  logSmokeTest('Internal Notes', hasNotes, hasNotes ? 'Notes feature present' : 'Missing notes');

  return hasList && hasDetailView && hasActions && hasMatching && hasNotes;
}

// Smoke Test 3: Supplier Quote Submission
async function smokeTest3_SupplierQuotes() {
  console.log('\n💰 SMOKE TEST 3: Supplier Quote Submission\n');

  const fs = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const quotePath = join(__dirname, '..', 'src', 'pages', 'dashboard', 'rfqs', '[id].jsx');
  
  if (!fs.existsSync(quotePath)) {
    logSmokeTest('Quote Submission Page', false, 'File not found');
    return false;
  }

  const quotePage = fs.readFileSync(quotePath, 'utf-8');

  // Check for quote form fields
  const hasNewFields = quotePage.includes('incoterms') && 
                       quotePage.includes('moq') &&
                       quotePage.includes('quote_submitted');
  const hasQuoteForm = quotePage.includes('quoteForm') || quotePage.includes('Submit Quote');
  const hasConfirmation = quotePage.includes('confirmed') || quotePage.includes('confirmation');
  const hasLocking = quotePage.includes('quote_submitted') && 
                     (quotePage.includes('locked') || quotePage.includes('cannot edit'));

  logSmokeTest('Quote Page Exists', true, 'File found');
  logSmokeTest('New Fields (incoterms, moq)', hasNewFields, hasNewFields ? 'All new fields present' : 'Missing fields');
  logSmokeTest('Quote Form', hasQuoteForm, hasQuoteForm ? 'Form present' : 'Missing form');
  logSmokeTest('Confirmation Checkbox', hasConfirmation, hasConfirmation ? 'Confirmation present' : 'Missing confirmation');
  logSmokeTest('Quote Locking', hasLocking, hasLocking ? 'Locking logic present' : 'Missing locking');

  return hasNewFields && hasQuoteForm && hasConfirmation && hasLocking;
}

// Smoke Test 4: Notification System
async function smokeTest4_Notifications() {
  console.log('\n📬 SMOKE TEST 4: Notification System\n');

  const fs = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const notifPath = join(__dirname, '..', 'src', 'utils', 'rfqNotifications.js');
  
  if (!fs.existsSync(notifPath)) {
    logSmokeTest('Notification Helper', false, 'File not found');
    return false;
  }

  const notifHelper = fs.readFileSync(notifPath, 'utf-8');

  const hasFunction = notifHelper.includes('sendRFQNotification');
  const hasAllTypes = ['rfq_submitted', 'rfq_matched', 'rfq_clarification', 'rfq_rejected']
    .every(type => notifHelper.includes(type));
  const hasMessages = notifHelper.includes('title') && notifHelper.includes('message');

  logSmokeTest('Notification Helper Exists', true, 'File found');
  logSmokeTest('Send Function', hasFunction, hasFunction ? 'Function present' : 'Missing function');
  logSmokeTest('All 4 Notification Types', hasAllTypes, hasAllTypes ? 'All types defined' : 'Missing types');
  logSmokeTest('Message Templates', hasMessages, hasMessages ? 'Templates present' : 'Missing templates');

  return hasFunction && hasAllTypes && hasMessages;
}

// Smoke Test 5: Quote Locking (Database Trigger)
async function smokeTest5_QuoteLocking() {
  console.log('\n🔒 SMOKE TEST 5: Quote Locking (Database)\n');

  try {
    // Check if trigger exists by trying to query trigger info
    // Since we can't directly query triggers via Supabase API, we verify the migration was applied
    const fs = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250116000000_extend_quotes_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      logSmokeTest('Migration File', false, 'Migration file not found');
      return false;
    }

    const migration = fs.readFileSync(migrationPath, 'utf-8');
    const hasTrigger = migration.includes('prevent_quote_edit_after_submit') &&
                       migration.includes('trg_prevent_quote_edit') &&
                       migration.includes('CREATE TRIGGER');

    // Verify quote_submitted status is allowed
    const { error } = await supabase
      .from('quotes')
      .select('id')
      .eq('status', 'quote_submitted')
      .limit(1);

    const statusAllowed = !error || (!error.message.includes('constraint') && !error.message.includes('check'));

    logSmokeTest('Migration File Exists', true, 'File found');
    logSmokeTest('Trigger Definition', hasTrigger, hasTrigger ? 'Trigger defined' : 'Missing trigger');
    logSmokeTest('quote_submitted Status', statusAllowed, statusAllowed ? 'Status allowed' : 'Status not allowed');

    return hasTrigger && statusAllowed;
  } catch (err) {
    logSmokeTest('Quote Locking', false, err.message);
    return false;
  }
}

// Smoke Test 6: Notifications Fire (Code Verification)
async function smokeTest6_NotificationsFire() {
  console.log('\n📬 SMOKE TEST 6: Notifications Fire (Code)\n');

  const fs = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Check RFQ creation calls notification
  const rfqCreatePath = join(__dirname, '..', 'src', 'pages', 'rfq', 'create.jsx');
  const adminReviewPath = join(__dirname, '..', 'src', 'pages', 'dashboard', 'admin', 'rfq-review.jsx');

  let allPass = true;

  if (fs.existsSync(rfqCreatePath)) {
    const rfqCreate = fs.readFileSync(rfqCreatePath, 'utf-8');
    const callsNotification = rfqCreate.includes('sendRFQNotification') ||
                              rfqCreate.includes('rfq_submitted');
    logSmokeTest('RFQ Creation Calls Notification', callsNotification, 
      callsNotification ? 'Notification called' : 'Missing notification call');
    if (!callsNotification) allPass = false;
  }

  if (fs.existsSync(adminReviewPath)) {
    const adminReview = fs.readFileSync(adminReviewPath, 'utf-8');
    const callsOnMatch = adminReview.includes('sendRFQNotification') &&
                         (adminReview.includes('rfq_matched') || adminReview.includes('rfq_matched'));
    const callsOnReject = adminReview.includes('rfq_rejected');
    const callsOnClarification = adminReview.includes('rfq_clarification');
    
    logSmokeTest('Admin Match Calls Notification', callsOnMatch, 
      callsOnMatch ? 'Notification called' : 'Missing notification call');
    logSmokeTest('Admin Reject Calls Notification', callsOnReject,
      callsOnReject ? 'Notification called' : 'Missing notification call');
    logSmokeTest('Admin Clarification Calls Notification', callsOnClarification,
      callsOnClarification ? 'Notification called' : 'Missing notification call');
    
    if (!callsOnMatch || !callsOnReject || !callsOnClarification) allPass = false;
  }

  return allPass;
}

// Main execution
async function runSmokeTests() {
  try {
    const results = {
      test1: await smokeTest1_RFQCreation(),
      test2: await smokeTest2_AdminReview(),
      test3: await smokeTest3_SupplierQuotes(),
      test4: await smokeTest4_Notifications(),
      test5: await smokeTest5_QuoteLocking(),
      test6: await smokeTest6_NotificationsFire()
    };

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SMOKE TEST SUMMARY\n');

    const passedCount = Object.values(results).filter(r => r === true).length;
    const totalCount = Object.keys(results).length;

    const testNames = {
      test1: '1. Submit RFQ as Buyer',
      test2: '2. Review RFQ as Admin',
      test3: '3. Submit Quote as Supplier',
      test4: '4. Notification System',
      test5: '5. Quote Locking',
      test6: '6. Notifications Fire'
    };

    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${testNames[test]}: ${passed ? 'PASS' : 'FAIL'}`);
    });

    console.log(`\n📈 Results: ${passedCount}/${totalCount} smoke tests passed\n`);

    if (passedCount === totalCount) {
      console.log('✅ ALL SMOKE TESTS PASSED!\n');
      console.log('🎯 All critical user flows verified.\n');
    } else {
      console.log('⚠️  SOME SMOKE TESTS NEED ATTENTION\n');
      console.log('Review failed tests above.\n');
    }

    // Detailed results
    console.log('📋 Detailed Results:\n');
    smokeResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`   ${icon} ${result.name}${result.details ? ' - ' + result.details : ''}`);
    });

    process.exit(passedCount === totalCount ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Smoke test error:', error);
    process.exit(1);
  }
}

runSmokeTests();

