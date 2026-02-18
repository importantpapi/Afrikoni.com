/**
 * AFRIKONI AUTO-TRANSLATOR (Google Cloud)
 * 
 * Usage: 
 * export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
 * node scripts/auto-translate-dashboard.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 } from '@google-cloud/translate';
const { Translate } = v2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Key (can be set via env var or passed directly if needed for quick test)
const projectId = 'afrikoni-translation'; // Placeholder
const translate = new Translate({ projectId });

const SOURCE_FILE = path.join(__dirname, '../src/i18n/extracted_strings.json');
const TARGET_LANGS = ['fr', 'pt', 'ar'];

async function translateText(text, target) {
    try {
        const [translation] = await translate.translate(text, target);
        return translation;
    } catch (error) {
        console.error(`Error translating "${text}" to ${target}:`, error.message);
        return text; // Fallback to original
    }
}

async function run() {
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error('❌ Source file not found: ' + SOURCE_FILE);
        process.exit(1);
    }

    const sourceStrings = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
    console.log(`INPUT: ${sourceStrings.length} strings to process.`);

    for (const lang of TARGET_LANGS) {
        const outputFile = path.join(__dirname, `../src/i18n/${lang}.json`);
        let existingTranslations = {};

        if (fs.existsSync(outputFile)) {
            existingTranslations = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        }

        const newTranslations = { ...existingTranslations };
        let addedCount = 0;

        console.log(`\n🌍 Processing language: ${lang.toUpperCase()}`);

        for (const text of sourceStrings) {
            if (!newTranslations[text]) {
                // Only translate if not already present
                // (Avoiding cost for re-runs)
                process.stdout.write(`Translating: "${text.substring(0, 20)}..." `);

                try {
                    const translatedText = await translateText(text, lang);
                    newTranslations[text] = translatedText;
                    addedCount++;
                    process.stdout.write(`✅\n`);
                } catch (e) {
                    process.stdout.write(`❌\n`);
                }

                // Rate limit simple pause (optional)
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        fs.writeFileSync(outputFile, JSON.stringify(newTranslations, null, 2));
        console.log(`🎉 Saved ${lang.toUpperCase()} translations. Added ${addedCount} new strings.`);
    }
}

run().catch(console.error);
