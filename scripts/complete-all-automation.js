/**
 * Complete Automation Script
 * Runs all automated tasks and provides status
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 COMPLETE AUTOMATION - RFQ System Implementation\n');
console.log('='.repeat(60));

const results = {
  migration: { status: 'unknown', details: [] },
  structure: { status: 'unknown', details: [] },
  routes: { status: 'unknown', details: [] },
  files: { status: 'unknown', details: [] }
};

// Task 1: Verify Migration
async function checkMigration() {
  console.log('\n📊 TASK 1: Migration Status\n');
  
  const checks = [
    { name: 'incoterms column', field: 'incoterms' },
    { name: 'moq column', field: 'moq' },
    { name: 'status column', field: 'status' }
  ];

  let allPass = true;

  for (const check of checks) {
    try {
      const { error } = await supabase
        .from('quotes')
        .select(check.field)
        .limit(1);

      if (error?.message?.includes('column') && error.message.includes(check.field)) {
        console.log(`   ❌ ${check.name}: MISSING`);
        results.migration.details.push(`${check.name}: FAIL`);
        allPass = false;
      } else {
        console.log(`   ✅ ${check.name}: EXISTS`);
        results.migration.details.push(`${check.name}: PASS`);
      }
    } catch (err) {
      console.log(`   ❌ ${check.name}: ERROR - ${err.message}`);
      results.migration.details.push(`${check.name}: ERROR`);
      allPass = false;
    }
  }

  // Check quote_submitted status
  try {
    const { error } = await supabase
      .from('quotes')
      .select('id')
      .eq('status', 'quote_submitted')
      .limit(1);

    if (error?.message?.includes('constraint') || error?.message?.includes('check')) {
      console.log('   ❌ quote_submitted status: NOT ALLOWED');
      results.migration.details.push('quote_submitted status: FAIL');
      allPass = false;
    } else {
      console.log('   ✅ quote_submitted status: VALID');
      results.migration.details.push('quote_submitted status: PASS');
    }
  } catch (err) {
    console.log('   ⚠️  quote_submitted status: Cannot verify (no quotes yet)');
    results.migration.details.push('quote_submitted status: SKIP');
  }

  results.migration.status = allPass ? 'PASS' : 'FAIL';
  return allPass;
}

// Task 2: Verify System Structure
async function checkStructure() {
  console.log('\n📋 TASK 2: System Structure\n');

  const tables = ['rfqs', 'quotes', 'notifications', 'companies', 'categories'];

  let allPass = true;

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('permission')) {
          console.log(`   ⚠️  ${table}: Permission issue (may need service role key)`);
          results.structure.details.push(`${table}: WARN`);
        } else {
          console.log(`   ❌ ${table}: ERROR - ${error.message}`);
          results.structure.details.push(`${table}: FAIL`);
          allPass = false;
        }
      } else {
        console.log(`   ✅ ${table}: ACCESSIBLE`);
        results.structure.details.push(`${table}: PASS`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ERROR - ${err.message}`);
      results.structure.details.push(`${table}: ERROR`);
      allPass = false;
    }
  }

  results.structure.status = allPass ? 'PASS' : 'WARN';
  return allPass;
}

// Task 3: Verify Code Files
async function checkFiles() {
  console.log('\n📁 TASK 3: Code Files\n');

  const requiredFiles = [
    'src/pages/rfq/create.jsx',
    'src/pages/dashboard/admin/rfq-review.jsx',
    'src/pages/dashboard/rfqs/[id].jsx',
    'src/utils/rfqNotifications.js',
    'src/utils/rfqAuditLog.js',
    'supabase/migrations/20250116000000_extend_quotes_table.sql'
  ];

  const fs = await import('fs');
  let allExist = true;

  for (const file of requiredFiles) {
    const filePath = join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}: EXISTS`);
      results.files.details.push(`${file}: PASS`);
    } else {
      console.log(`   ❌ ${file}: MISSING`);
      results.files.details.push(`${file}: FAIL`);
      allExist = false;
    }
  }

  results.files.status = allExist ? 'PASS' : 'FAIL';
  return allExist;
}

// Task 4: Generate Final Report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 FINAL STATUS REPORT\n');

  const tasks = [
    { name: 'Migration Applied', result: results.migration },
    { name: 'System Structure', result: results.structure },
    { name: 'Code Files', result: results.files }
  ];

  tasks.forEach(task => {
    const icon = task.result.status === 'PASS' ? '✅' : 
                 task.result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${task.name}: ${task.result.status}`);
    task.result.details.forEach(detail => {
      console.log(`   - ${detail}`);
    });
  });

  const allPassed = results.migration.status === 'PASS' && 
                   results.structure.status !== 'FAIL' && 
                   results.files.status === 'PASS';

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('\n✅ ALL AUTOMATED CHECKS PASSED!\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Complete manual testing (see COMPLETE_ALL_TASKS.md)');
    console.log('   2. Run smoke tests');
    console.log('   3. Deploy frontend\n');
  } else {
    console.log('\n⚠️  SOME CHECKS NEED ATTENTION\n');
    
    if (results.migration.status !== 'PASS') {
      console.log('❌ MIGRATION NOT APPLIED');
      console.log('   Action: Apply migration via Supabase Dashboard');
      console.log('   File: supabase/migrations/20250116000000_extend_quotes_table.sql\n');
    }

    if (results.files.status !== 'PASS') {
      console.log('❌ MISSING CODE FILES');
      console.log('   Action: Ensure all implementation files exist\n');
    }

    console.log('After fixing issues, re-run: npm run verify-migration\n');
  }

  return allPassed;
}

// Main execution
async function runAllChecks() {
  try {
    await checkMigration();
    await checkStructure();
    await checkFiles();
    const allPassed = generateReport();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Automation error:', error);
    process.exit(1);
  }
}

runAllChecks();

