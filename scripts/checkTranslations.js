/**
 * Translation Coverage Test Script
 * 
 * Ensures all translation keys exist in all languages and no values are empty.
 * Fails build if any translations are missing.
 * 
 * Usage: node scripts/checkTranslations.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Path to translations file
const TRANSLATIONS_PATH = join(__dirname, '../src/i18n/translations.js');

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar', 'pt'];

/**
 * Extract all keys from translations object
 * Translations are flat objects with dot-notation keys like 'nav.marketplace'
 */
function extractKeys(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj);
}

/**
 * Get value from translations object (flat structure)
 */
function getTranslationValue(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;
  return obj[key];
}

/**
 * Check translations for missing keys and empty values
 */
async function checkTranslations() {
  console.log('🔍 Checking translation coverage...\n');
  
  try {
    // Import translations module dynamically
    const fileUrl = `file://${TRANSLATIONS_PATH}`;
    const translationsModule = await import(fileUrl);
    const translations = translationsModule.translations;
    
    if (!translations) {
      throw new Error('Could not find translations object in file');
    }
    
    // Get all keys from English (source of truth)
    const sourceKeys = extractKeys(translations.en || {});
    
    if (sourceKeys.length === 0) {
      throw new Error('No translation keys found in English (en)');
    }
    
    console.log(`✅ Found ${sourceKeys.length} translation keys in English (source of truth)\n`);
    
    const errors = [];
    const warnings = [];
    
    // Check each language
    for (const lang of SUPPORTED_LANGUAGES) {
      console.log(`Checking ${lang.toUpperCase()}...`);
      
      if (!translations[lang]) {
        errors.push({
          type: 'MISSING_LANGUAGE',
          language: lang,
          message: `Language '${lang}' is not defined in translations`
        });
        continue;
      }
      
      const langKeys = extractKeys(translations[lang]);
      const missingKeys = [];
      const emptyValues = [];
      
      // Check for missing keys
      for (const key of sourceKeys) {
        const value = getTranslationValue(translations[lang], key);
        
        if (value === undefined) {
          missingKeys.push(key);
        } else if (value === '' || value === null) {
          emptyValues.push(key);
        }
      }
      
      // Check for extra keys (not in source)
      const extraKeys = langKeys.filter(key => !sourceKeys.includes(key));
      
      if (missingKeys.length > 0) {
        errors.push({
          type: 'MISSING_KEYS',
          language: lang,
          keys: missingKeys,
          count: missingKeys.length
        });
      }
      
      if (emptyValues.length > 0) {
        errors.push({
          type: 'EMPTY_VALUES',
          language: lang,
          keys: emptyValues,
          count: emptyValues.length
        });
      }
      
      if (extraKeys.length > 0) {
        warnings.push({
          type: 'EXTRA_KEYS',
          language: lang,
          keys: extraKeys,
          count: extraKeys.length
        });
      }
      
      if (missingKeys.length === 0 && emptyValues.length === 0) {
        console.log(`  ✅ All keys present and non-empty (${langKeys.length} keys)`);
      }
    }
    
    console.log('\n');
    
    // Report errors
    if (errors.length > 0) {
      console.error('❌ TRANSLATION ERRORS FOUND:\n');
      
      for (const error of errors) {
        if (error.type === 'MISSING_LANGUAGE') {
          console.error(`  ❌ ${error.language.toUpperCase()}: ${error.message}`);
        } else if (error.type === 'MISSING_KEYS') {
          console.error(`  ❌ ${error.language.toUpperCase()}: Missing ${error.count} key(s):`);
          error.keys.slice(0, 10).forEach(key => {
            console.error(`     - ${key}`);
          });
          if (error.keys.length > 10) {
            console.error(`     ... and ${error.keys.length - 10} more`);
          }
        } else if (error.type === 'EMPTY_VALUES') {
          console.error(`  ❌ ${error.language.toUpperCase()}: ${error.count} empty value(s):`);
          error.keys.slice(0, 10).forEach(key => {
            console.error(`     - ${key}`);
          });
          if (error.keys.length > 10) {
            console.error(`     ... and ${error.keys.length - 10} more`);
          }
        }
        console.error('');
      }
      
      console.error(`\n❌ Total errors: ${errors.length}`);
      console.error('❌ Build will fail. Please fix missing translations before deploying.\n');
      process.exit(1);
    }
    
    // Report warnings
    if (warnings.length > 0) {
      console.warn('⚠️  TRANSLATION WARNINGS:\n');
      
      for (const warning of warnings) {
        console.warn(`  ⚠️  ${warning.language.toUpperCase()}: ${warning.count} extra key(s) not in source:`);
        warning.keys.slice(0, 5).forEach(key => {
          console.warn(`     - ${key}`);
        });
        if (warning.keys.length > 5) {
          console.warn(`     ... and ${warning.keys.length - 5} more`);
        }
        console.warn('');
      }
    }
    
    // Success
    console.log('✅ All translations are complete!');
    console.log(`✅ All ${SUPPORTED_LANGUAGES.length} languages have all ${sourceKeys.length} keys`);
    console.log('✅ No empty values found\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking translations:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run check
checkTranslations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

