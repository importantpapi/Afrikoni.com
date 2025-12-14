#!/usr/bin/env node
/**
 * Script to apply notifications RLS policy fix
 * This can be run via Supabase Dashboard SQL Editor or via this script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.join(__dirname, 'supabase/migrations/20250115000001_fix_notifications_rls_comprehensive.sql');

console.log('📋 Notifications RLS Policy Fix');
console.log('================================\n');

if (!fs.existsSync(migrationFile)) {
  console.error('❌ Migration file not found:', migrationFile);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('✅ Migration SQL loaded\n');
console.log('📝 To apply this migration:\n');
console.log('OPTION 1: Via Supabase Dashboard (Recommended)');
console.log('1. Go to: https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new');
console.log('2. Copy the SQL below');
console.log('3. Paste and run it\n');
console.log('OPTION 2: Via Supabase CLI (if installed)');
console.log('   supabase db push\n');
console.log('─'.repeat(60));
console.log('\nSQL to apply:\n');
console.log(sql);
console.log('\n─'.repeat(60));
console.log('\n✅ After applying, refresh your browser and check for 403 errors.');

