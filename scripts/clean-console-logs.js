#!/usr/bin/env node
/**
 * Clean Console Logs Script
 * Removes development console.log and console.warn statements
 * Keeps console.error for production error tracking
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to remove (development logging only)
const REMOVE_PATTERNS = [
  /console\.log\([^)]*\);?\s*$/gm,
  /console\.warn\([^)]*\);?\s*$/gm,
];

// Keep these (production error tracking)
// - console.error

let filesProcessed = 0;
let linesRemoved = 0;

function shouldProcessFile(filePath) {
  return EXTENSIONS.some(ext => filePath.endsWith(ext));
}

function cleanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let newContent = content;
    let removedInFile = 0;

    // Remove console.log and console.warn statements
    for (const pattern of REMOVE_PATTERNS) {
      const matches = newContent.match(pattern) || [];
      removedInFile += matches.length;
      newContent = newContent.replace(pattern, '');
    }

    // Remove empty lines left behind
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (removedInFile > 0) {
      writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath.replace(process.cwd(), '.')}: ${removedInFile} statements removed`);
      linesRemoved += removedInFile;
    }

    filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        walkDirectory(filePath);
      }
    } else if (shouldProcessFile(filePath)) {
      cleanFile(filePath);
    }
  }
}

console.log('🧹 Cleaning console.log and console.warn statements...\n');
walkDirectory(SRC_DIR);
console.log(`\n✅ Complete! ${filesProcessed} files processed, ${linesRemoved} statements removed`);
console.log('ℹ️  console.error statements were preserved for production error tracking');
