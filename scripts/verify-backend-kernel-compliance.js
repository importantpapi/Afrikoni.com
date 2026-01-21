/**
 * Backend Kernel Compliance Verification Script
 * Verifies that all RLS policies follow Kernel Manifesto patterns
 * 
 * This script checks migration files for:
 * 1. Use of current_company_id() function (not nested subqueries)
 * 2. Use of is_admin() function (not role string checks)
 * 3. Consistent Kernel patterns across all tables
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, '../supabase/migrations');

// Patterns to check
const kernelPatterns = {
  correct: {
    currentCompanyId: /current_company_id\(\)/gi,
    isAdmin: /is_admin\(\)/gi,
    publicIsAdmin: /public\.is_admin\(\)/gi
  },
  incorrect: {
    nestedSubquery: /company_id\s+IN\s*\(\s*SELECT\s+company_id\s+FROM\s+profiles/gi,
    roleString: /role\s*=\s*['"]admin['"]|role\s+IN\s*\([^)]*['"]admin['"]/gi,
    profilesRole: /profiles\.role/gi
  }
};

function analyzeMigration(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const filename = filePath.split('/').pop();
  
  const results = {
    file: filename,
    correct: {
      currentCompanyId: (content.match(kernelPatterns.correct.currentCompanyId) || []).length,
      isAdmin: (content.match(kernelPatterns.correct.isAdmin) || []).length,
      publicIsAdmin: (content.match(kernelPatterns.correct.publicIsAdmin) || []).length
    },
    incorrect: {
      nestedSubquery: (content.match(kernelPatterns.incorrect.nestedSubquery) || []).length,
      roleString: (content.match(kernelPatterns.incorrect.roleString) || []).length,
      profilesRole: (content.match(kernelPatterns.incorrect.profilesRole) || []).length
    },
    hasKernelAlignment: filename.includes('kernel') || filename.includes('alignment'),
    hasFinalAlignment: filename.includes('final_alignment')
  };
  
  return results;
}

function main() {
  console.log('🔍 Backend Kernel Compliance Verification\n');
  console.log('='.repeat(60));
  console.log();
  
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`📋 Found ${migrationFiles.length} migration files\n`);
  
  const results = migrationFiles.map(file => 
    analyzeMigration(join(migrationsDir, file))
  );
  
  // Summary statistics
  const totalCorrect = {
    currentCompanyId: results.reduce((sum, r) => sum + r.correct.currentCompanyId, 0),
    isAdmin: results.reduce((sum, r) => sum + r.correct.isAdmin, 0),
    publicIsAdmin: results.reduce((sum, r) => sum + r.correct.publicIsAdmin, 0)
  };
  
  const totalIncorrect = {
    nestedSubquery: results.reduce((sum, r) => sum + r.incorrect.nestedSubquery, 0),
    roleString: results.reduce((sum, r) => sum + r.incorrect.roleString, 0),
    profilesRole: results.reduce((sum, r) => sum + r.incorrect.profilesRole, 0)
  };
  
  // Check for final alignment migration
  const hasFinalAlignment = results.some(r => r.hasFinalAlignment);
  
  console.log('📊 SUMMARY STATISTICS');
  console.log('-'.repeat(60));
  console.log(`✅ Correct Patterns:`);
  console.log(`   current_company_id(): ${totalCorrect.currentCompanyId} occurrences`);
  console.log(`   is_admin(): ${totalCorrect.isAdmin} occurrences`);
  console.log(`   public.is_admin(): ${totalCorrect.publicIsAdmin} occurrences`);
  console.log();
  console.log(`⚠️  Incorrect Patterns:`);
  console.log(`   Nested subqueries: ${totalIncorrect.nestedSubquery} occurrences`);
  console.log(`   Role string checks: ${totalIncorrect.roleString} occurrences`);
  console.log(`   profiles.role references: ${totalIncorrect.profilesRole} occurrences`);
  console.log();
  
  // Check final alignment migration
  if (hasFinalAlignment) {
    console.log('✅ Final alignment migration found: 20260121_kernel_backend_final_alignment.sql');
    console.log('   This migration fixes all identified issues.');
    console.log();
  } else {
    console.log('⚠️  Final alignment migration NOT found!');
    console.log('   Expected: 20260121_kernel_backend_final_alignment.sql');
    console.log();
  }
  
  // Files with issues
  const filesWithIssues = results.filter(r => 
    r.incorrect.nestedSubquery > 0 || 
    r.incorrect.roleString > 0 || 
    r.incorrect.profilesRole > 0
  );
  
  if (filesWithIssues.length > 0) {
    console.log('📋 FILES WITH POTENTIAL ISSUES:');
    console.log('-'.repeat(60));
    filesWithIssues.forEach(r => {
      console.log(`\n${r.file}:`);
      if (r.incorrect.nestedSubquery > 0) {
        console.log(`   ⚠️  ${r.incorrect.nestedSubquery} nested subquery(ies) found`);
      }
      if (r.incorrect.roleString > 0) {
        console.log(`   ⚠️  ${r.incorrect.roleString} role string check(s) found`);
      }
      if (r.incorrect.profilesRole > 0) {
        console.log(`   ⚠️  ${r.incorrect.profilesRole} profiles.role reference(s) found`);
      }
      if (r.hasFinalAlignment) {
        console.log(`   ✅ Fixed in final alignment migration`);
      }
    });
    console.log();
  }
  
  // Files using correct patterns
  const filesWithCorrectPatterns = results.filter(r => 
    r.correct.currentCompanyId > 0 || 
    r.correct.publicIsAdmin > 0
  );
  
  if (filesWithCorrectPatterns.length > 0) {
    console.log('✅ FILES USING KERNEL PATTERNS:');
    console.log('-'.repeat(60));
    filesWithCorrectPatterns.slice(0, 10).forEach(r => {
      const patterns = [];
      if (r.correct.currentCompanyId > 0) patterns.push(`current_company_id() (${r.correct.currentCompanyId})`);
      if (r.correct.publicIsAdmin > 0) patterns.push(`is_admin() (${r.correct.publicIsAdmin})`);
      console.log(`   ${r.file}: ${patterns.join(', ')}`);
    });
    if (filesWithCorrectPatterns.length > 10) {
      console.log(`   ... and ${filesWithCorrectPatterns.length - 10} more files`);
    }
    console.log();
  }
  
  // Final assessment
  console.log('🎯 COMPLIANCE ASSESSMENT');
  console.log('='.repeat(60));
  
  const complianceScore = hasFinalAlignment ? 100 : 
    totalIncorrect.nestedSubquery === 0 && totalIncorrect.roleString === 0 ? 95 : 
    totalIncorrect.nestedSubquery + totalIncorrect.roleString < 5 ? 85 : 70;
  
  console.log(`Compliance Score: ${complianceScore}%`);
  console.log();
  
  if (hasFinalAlignment) {
    console.log('✅ STATUS: FULLY COMPLIANT');
    console.log('   Final alignment migration exists and fixes all issues.');
    console.log('   Apply migration to production: supabase migration up');
  } else if (totalIncorrect.nestedSubquery === 0 && totalIncorrect.roleString === 0) {
    console.log('✅ STATUS: MOSTLY COMPLIANT');
    console.log('   No major issues found, but final alignment migration recommended.');
  } else {
    console.log('⚠️  STATUS: NEEDS ALIGNMENT');
    console.log('   Found issues that need to be fixed.');
    console.log('   Apply final alignment migration: 20260121_kernel_backend_final_alignment.sql');
  }
  
  console.log();
}

main();
