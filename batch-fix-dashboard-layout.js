#!/usr/bin/env node
/**
 * Batch fix script to remove DashboardLayout wrappers from all dashboard pages
 * This script identifies files that need fixing and provides a report
 */

const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, 'src/pages/dashboard');
const filesToFix = [];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.jsx') && file !== 'WorkspaceDashboard.jsx' && file !== 'index.jsx') {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file imports DashboardLayout
      if (content.includes('import DashboardLayout') || content.includes('from \'@/layouts/DashboardLayout\'')) {
        // Check if file uses DashboardLayout (not just imports)
        if (content.includes('<DashboardLayout') || content.includes('</DashboardLayout>')) {
          filesToFix.push(filePath);
        }
      }
    }
  });
}

console.log('🔍 Scanning dashboard pages...\n');
scanDirectory(dashboardDir);

console.log(`✅ Found ${filesToFix.length} files that need fixing:\n`);
filesToFix.forEach((file, index) => {
  const relativePath = path.relative(__dirname, file);
  console.log(`${index + 1}. ${relativePath}`);
});

console.log(`\n📋 Summary: ${filesToFix.length} files need DashboardLayout removal`);
