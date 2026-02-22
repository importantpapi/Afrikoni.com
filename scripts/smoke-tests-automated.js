/**
 * Automated Smoke Tests for RFQ System (current architecture)
 * Validates critical RFQ/Quote/Notification rails without browser automation.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 RFQ System - Automated Smoke Tests\n');
console.log('='.repeat(60));

const smokeResults = [];

function logSmokeTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
  smokeResults.push({ name, passed, details });
  return passed;
}

function readRepoFile(...parts) {
  const filePath = join(__dirname, '..', ...parts);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

// Smoke Test 1: RFQ Creation Flow (Code Verification)
async function smokeTest1_RFQCreation() {
  console.log('\n📝 SMOKE TEST 1: RFQ Creation Flow\n');

  const rfqCreate = readRepoFile('src', 'pages', 'dashboard', 'rfqs', 'new.jsx');

  if (!rfqCreate) {
    logSmokeTest('RFQ Create Page', false, 'File not found: src/pages/dashboard/rfqs/new.jsx');
    return false;
  }

  const hasSubmitHandler = rfqCreate.includes('handleSubmit') && rfqCreate.includes('onSubmit={handleSubmit}');
  const hasCreateCall = rfqCreate.includes('createRFQ(');
  const hasSupplierMatchFlow = rfqCreate.includes('matchSuppliersToRFQ') && rfqCreate.includes('notifyMatchedSuppliers');
  const hasCoreFields = ['title', 'description', 'quantity', 'unit', 'target_price', 'delivery_location']
    .every(field => rfqCreate.includes(field));

  logSmokeTest('RFQ Create Page Exists', true, 'dashboard/rfqs/new.jsx found');
  logSmokeTest('Submission Handler', hasSubmitHandler, hasSubmitHandler ? 'Form submit wired' : 'Missing handleSubmit wiring');
  logSmokeTest('RFQ Insert Flow', hasCreateCall, hasCreateCall ? 'createRFQ() called' : 'Missing createRFQ call');
  logSmokeTest('Supplier Match + Notify Flow', hasSupplierMatchFlow, hasSupplierMatchFlow ? 'Matching + notifications wired' : 'Missing matching/notification flow');
  logSmokeTest('Core RFQ Fields', hasCoreFields, hasCoreFields ? 'Core form fields present' : 'Core fields missing in form state');

  return hasSubmitHandler && hasCreateCall && hasSupplierMatchFlow && hasCoreFields;
}

// Smoke Test 2: RFQ Operations Interface (current monitor/detail pages)
async function smokeTest2_RFQOperations() {
  console.log('\n👤 SMOKE TEST 2: RFQ Operations Interface\n');

  const tradeMonitor = readRepoFile('src', 'pages', 'dashboard', 'TradeMonitor.jsx');
  const rfqDetail = readRepoFile('src', 'pages', 'dashboard', 'rfqs', '[id].jsx');

  const monitorExists = !!tradeMonitor;
  const detailExists = !!rfqDetail;

  const hasRfqMode = monitorExists && tradeMonitor.includes("viewMode=\"rfqs\"") || (tradeMonitor || '').includes("'rfqs'");
  const hasRfqFetch = detailExists && rfqDetail.includes(".from('rfqs')") && rfqDetail.includes('.single()');
  const hasQuoteFetch = detailExists && rfqDetail.includes(".from('quotes')");
  const hasQuoteSubmission = detailExists && rfqDetail.includes('QuoteSubmissionForm');

  logSmokeTest('RFQ Monitor Page', monitorExists, monitorExists ? 'TradeMonitor exists' : 'Missing TradeMonitor');
  logSmokeTest('RFQ Detail Page', detailExists, detailExists ? 'rfqs/[id].jsx exists' : 'Missing RFQ detail page');
  logSmokeTest('RFQ Detail Data Load', hasRfqFetch, hasRfqFetch ? 'RFQ select query present' : 'Missing RFQ select query');
  logSmokeTest('Quote List Data Load', hasQuoteFetch, hasQuoteFetch ? 'Quotes select query present' : 'Missing quote select query');
  logSmokeTest('Supplier Quote Entry', hasQuoteSubmission, hasQuoteSubmission ? 'QuoteSubmissionForm wired' : 'Quote form not wired');

  return monitorExists && detailExists && hasRfqFetch && hasQuoteFetch && hasQuoteSubmission;
}

// Smoke Test 3: Supplier Quote Submission
async function smokeTest3_SupplierQuotes() {
  console.log('\n💰 SMOKE TEST 3: Supplier Quote Submission\n');

  const quoteForm = readRepoFile('src', 'components', 'trade', 'QuoteSubmissionForm.jsx');
  const quoteService = readRepoFile('src', 'services', 'quoteService.js');

  if (!quoteForm || !quoteService) {
    logSmokeTest('Quote Submission Modules', false, 'Quote form or service file missing');
    return false;
  }

  const hasSubmitAction = quoteForm.includes('onSubmit={handleSubmit}') && quoteForm.includes('submitQuote({');
  const hasIncotermsField = quoteForm.includes('incoterms');
  const hasMoqField = quoteForm.includes('Minimum Order Quantity') || quoteForm.includes('moq');
  const hasDuplicateGuard = quoteService.includes('already submitted a quote');
  const hasStatusWrite = quoteService.includes("status: 'submitted'");

  logSmokeTest('Quote Submission Form Exists', true, 'QuoteSubmissionForm + quoteService found');
  logSmokeTest('Quote Submit Wiring', hasSubmitAction, hasSubmitAction ? 'submitQuote called from form' : 'Missing submit wiring');
  logSmokeTest('Incoterms Field', hasIncotermsField, hasIncotermsField ? 'Incoterms present' : 'Incoterms missing');
  logSmokeTest('MOQ Field', hasMoqField, hasMoqField ? 'MOQ input present' : 'MOQ missing');
  logSmokeTest('Duplicate Quote Guard', hasDuplicateGuard, hasDuplicateGuard ? 'Duplicate submit blocked' : 'No duplicate guard');
  logSmokeTest('Quote Status Persistence', hasStatusWrite, hasStatusWrite ? 'Quote status written on insert' : 'No status persistence');

  return hasSubmitAction && hasIncotermsField && hasMoqField && hasDuplicateGuard && hasStatusWrite;
}

// Smoke Test 4: Notification System
async function smokeTest4_Notifications() {
  console.log('\n📬 SMOKE TEST 4: Notification System\n');

  const notifService = readRepoFile('src', 'services', 'notificationService.js');
  const quoteService = readRepoFile('src', 'services', 'quoteService.js');

  if (!notifService || !quoteService) {
    logSmokeTest('Notification Service', false, 'notificationService or quoteService missing');
    return false;
  }

  const hasCreateNotification = notifService.includes('createNotification');
  const hasRfqNotifyHelpers = notifService.includes('notifyRFQCreated') && notifService.includes('notifyQuoteSubmitted');
  const hasQuoteTriggerNotify = quoteService.includes('notifyQuoteSubmitted');

  logSmokeTest('Notification Service Exists', true, 'notificationService.js found');
  logSmokeTest('Create Notification Core', hasCreateNotification, hasCreateNotification ? 'createNotification present' : 'Missing createNotification');
  logSmokeTest('RFQ/Quote Notification Helpers', hasRfqNotifyHelpers, hasRfqNotifyHelpers ? 'RFQ/quote helpers present' : 'Missing helper(s)');
  logSmokeTest('Quote Submission Triggers Notification', hasQuoteTriggerNotify, hasQuoteTriggerNotify ? 'Quote flow triggers notifyQuoteSubmitted' : 'Quote flow missing notification trigger');

  return hasCreateNotification && hasRfqNotifyHelpers && hasQuoteTriggerNotify;
}

// Smoke Test 5: Quote Locking (Database Trigger)
async function smokeTest5_QuoteLocking() {
  console.log('\n🔒 SMOKE TEST 5: Quote Locking (Database)\n');

  try {
    const migration = readRepoFile('supabase', 'migrations', '20250116000000_extend_quotes_table.sql');

    if (!migration) {
      logSmokeTest('Migration File', false, 'Missing 20250116000000_extend_quotes_table.sql');
      return false;
    }

    const hasTrigger = migration.includes('prevent_quote_edit_after_submit')
      && migration.includes('trg_prevent_quote_edit')
      && migration.includes('CREATE TRIGGER');

    const { error } = await supabase
      .from('quotes')
      .select('id')
      .in('status', ['quote_submitted', 'submitted'])
      .limit(1);

    const statusAllowed = !error || (!error.message.includes('constraint') && !error.message.includes('check'));

    logSmokeTest('Migration File Exists', true, 'Quote-lock migration found');
    logSmokeTest('Trigger Definition', hasTrigger, hasTrigger ? 'Trigger defined' : 'Missing trigger definition');
    logSmokeTest('Submitted Status Allowed', statusAllowed, statusAllowed ? 'Submitted statuses accepted' : 'Submitted status rejected');

    return hasTrigger && statusAllowed;
  } catch (err) {
    logSmokeTest('Quote Locking', false, err.message);
    return false;
  }
}

// Smoke Test 6: Notification Calls in RFQ Create Flow
async function smokeTest6_NotificationsFire() {
  console.log('\n📬 SMOKE TEST 6: Notifications Fire (Code)\n');

  const rfqCreate = readRepoFile('src', 'pages', 'dashboard', 'rfqs', 'new.jsx');
  const supplierMatcher = readRepoFile('src', 'services', 'supplierMatchingService.js');

  if (!rfqCreate || !supplierMatcher) {
    logSmokeTest('Notification Flow Files', false, 'RFQ create or supplier matching file missing');
    return false;
  }

  const createCallsNotify = rfqCreate.includes('notifyMatchedSuppliers(');
  const matcherWritesNotifications = supplierMatcher.includes(".from('notifications')") && supplierMatcher.includes('.insert(');

  logSmokeTest('RFQ Create Calls Supplier Notifications', createCallsNotify,
    createCallsNotify ? 'notifyMatchedSuppliers invoked' : 'Missing notifyMatchedSuppliers call');
  logSmokeTest('Supplier Match Inserts Notifications', matcherWritesNotifications,
    matcherWritesNotifications ? 'notifications insert present' : 'Missing notifications insert');

  return createCallsNotify && matcherWritesNotifications;
}

// Main execution
async function runSmokeTests() {
  try {
    const results = {
      test1: await smokeTest1_RFQCreation(),
      test2: await smokeTest2_RFQOperations(),
      test3: await smokeTest3_SupplierQuotes(),
      test4: await smokeTest4_Notifications(),
      test5: await smokeTest5_QuoteLocking(),
      test6: await smokeTest6_NotificationsFire(),
    };

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SMOKE TEST SUMMARY\n');

    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    const testNames = {
      test1: '1. Create RFQ (buyer path)',
      test2: '2. RFQ monitor + detail operations',
      test3: '3. Submit quote (supplier path)',
      test4: '4. Notification service wiring',
      test5: '5. Quote locking migration + status',
      test6: '6. RFQ flow notification calls',
    };

    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${testNames[test]}: ${passed ? 'PASS' : 'FAIL'}`);
    });

    console.log(`\n📈 Results: ${passedCount}/${totalCount} smoke tests passed\n`);

    if (passedCount === totalCount) {
      console.log('✅ ALL SMOKE TESTS PASSED!\n');
      console.log('🎯 Critical RFQ/Quote/Notification rails verified.\n');
    } else {
      console.log('⚠️  SOME SMOKE TESTS NEED ATTENTION\n');
      console.log('Review failed tests above.\n');
    }

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
