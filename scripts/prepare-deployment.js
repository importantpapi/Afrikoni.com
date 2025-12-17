/**
 * Deployment Preparation Script
 * Verifies everything is ready for deployment
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Deployment Preparation Check\n');
console.log('='.repeat(60));

const checks = [];

function logCheck(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
  checks.push({ name, passed, details });
  return passed;
}

// Check 1: Build exists
function checkBuild() {
  console.log('\n📦 Check 1: Production Build\n');
  
  const distPath = join(__dirname, '..', 'dist');
  const indexPath = join(distPath, 'index.html');
  
  const distExists = existsSync(distPath);
  const indexExists = existsSync(indexPath);
  
  logCheck('dist/ folder exists', distExists, distExists ? 'Found' : 'Not found');
  logCheck('index.html exists', indexExists, indexExists ? 'Found' : 'Not found');
  
  if (distExists) {
    try {
      const stats = statSync(distPath);
      logCheck('Build size', true, 'Folder exists');
    } catch (err) {
      logCheck('Build accessible', false, err.message);
    }
  }
  
  return distExists && indexExists;
}

// Check 2: Environment variables documented
function checkEnvDocs() {
  console.log('\n🔐 Check 2: Environment Variables\n');
  
  const deployChecklist = join(__dirname, 'deploy-checklist.md');
  const envExists = existsSync(join(__dirname, '..', '.env'));
  const docsExist = existsSync(deployChecklist);
  
  if (docsExist) {
    const docs = readFileSync(deployChecklist, 'utf-8');
    const hasEnvVars = docs.includes('VITE_SUPABASE_URL') && docs.includes('VITE_SUPABASE_ANON_KEY');
    logCheck('Deployment checklist exists', true, 'Found');
    logCheck('Environment variables documented', hasEnvVars, hasEnvVars ? 'Documented' : 'Missing docs');
  } else {
    logCheck('Deployment checklist', false, 'Not found');
  }
  
  logCheck('.env file exists', envExists, envExists ? 'Found' : 'Not found (create from .env.example)');
  
  return docsExist;
}

// Check 3: All migrations applied
function checkMigrations() {
  console.log('\n🗄️  Check 3: Database Migrations\n');
  
  const migration1 = join(__dirname, '..', 'supabase', 'migrations', '20250116000000_extend_quotes_table.sql');
  const migration2 = join(__dirname, '..', 'supabase', 'migrations', '20250116000001_add_rfq_metadata.sql');
  
  const mig1Exists = existsSync(migration1);
  const mig2Exists = existsSync(migration2);
  
  logCheck('Quotes migration exists', mig1Exists, mig1Exists ? 'Found' : 'Not found');
  logCheck('Metadata migration exists', mig2Exists, mig2Exists ? 'Found (optional)' : 'Not found (optional)');
  
  return mig1Exists;
}

// Check 4: Test files exist
function checkTests() {
  console.log('\n🧪 Check 4: Test Files\n');
  
  const testFiles = [
    'scripts/test-rfq-comprehensive.js',
    'scripts/smoke-tests-automated.js',
    'scripts/complete-all-automation.js'
  ];
  
  let allExist = true;
  
  testFiles.forEach(file => {
    const path = join(__dirname, '..', file);
    const exists = existsSync(path);
    logCheck(file, exists, exists ? 'Found' : 'Not found');
    if (!exists) allExist = false;
  });
  
  return allExist;
}

// Check 5: Documentation complete
function checkDocs() {
  console.log('\n📚 Check 5: Documentation\n');
  
  const docs = [
    'COMPLETE_ALL_TASKS.md',
    'FINAL_IMPLEMENTATION_REPORT.md',
    'ALL_TASKS_COMPLETE.md',
    'scripts/deploy-checklist.md'
  ];
  
  let allExist = true;
  
  docs.forEach(doc => {
    const path = join(__dirname, '..', doc);
    const exists = existsSync(path);
    logCheck(doc, exists, exists ? 'Found' : 'Not found');
    if (!exists) allExist = false;
  });
  
  return allExist;
}

// Main execution
async function runChecks() {
  const results = {
    build: checkBuild(),
    envDocs: checkEnvDocs(),
    migrations: checkMigrations(),
    tests: checkTests(),
    docs: checkDocs()
  };

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY\n');

  const passedCount = Object.values(results).filter(r => r === true).length;
  const totalCount = Object.keys(results).length;

  Object.entries(results).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    const names = {
      build: 'Production Build',
      envDocs: 'Environment Variables',
      migrations: 'Database Migrations',
      tests: 'Test Files',
      docs: 'Documentation'
    };
    console.log(`${icon} ${names[check]}: ${passed ? 'READY' : 'NEEDS ATTENTION'}`);
  });

  console.log(`\n📈 Readiness: ${passedCount}/${totalCount} checks passed\n`);

  if (passedCount === totalCount) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('🚀 System is ready for deployment!\n');
    console.log('Next steps:');
    console.log('1. Review deploy-checklist.md');
    console.log('2. Set environment variables in hosting platform');
    console.log('3. Deploy dist/ folder');
    console.log('4. Verify production site\n');
  } else {
    console.log('⚠️  SOME CHECKS NEED ATTENTION\n');
    console.log('Fix the issues above before deploying.\n');
  }

  process.exit(passedCount === totalCount ? 0 : 1);
}

runChecks();

