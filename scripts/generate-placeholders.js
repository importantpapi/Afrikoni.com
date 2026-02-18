/**
 * AFRIKONI TRANSLATION GENERATOR (Free Tier / Placeholder)
 * 
 * Generates fr.json, pt.json, ar.json using extracted strings.
 * Since we don't have a paid API key, we create the file structure
 * with English values (prefixed) so the system works.
 * 
 * Usage: node scripts/generate-placeholders.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, '../src/i18n/extracted_strings.json');
const TARGET_LANGS = ['fr', 'pt', 'ar'];

// Simple map for common UI words to show *some* French/Portuguese validity
// This is just to prove the system switches languages
const COMMON_DICTIONARY = {
    fr: {
        "Dashboard": "Tableau de bord",
        "Marketplace": "Marché",
        "Products": "Produits",
        "Orders": "Commandes",
        "Settings": "Paramètres",
        "Profile": "Profil",
        "Logout": "Déconnexion",
        "Search": "Rechercher",
        "Welcome": "Bienvenue",
        "Home": "Accueil"
    },
    pt: {
        "Dashboard": "Painel",
        "Marketplace": "Mercado",
        "Products": "Produtos",
        "Orders": "Pedidos",
        "Settings": "Configurações",
        "Profile": "Perfil",
        "Logout": "Sair",
        "Search": "Buscar",
        "Welcome": "Bem-vindo",
        "Home": "Início"
    },
    ar: {
        "Dashboard": "لوحة القيادة",
        "Marketplace": "السوق",
        "Products": "المنتجات",
        "Orders": "الطلبات",
        "Settings": "الإعدادات",
        "Profile": "الملف الشخصي",
        "Logout": "تسجيل خروج",
        "Search": "بحث",
        "Welcome": "مرحباً",
        "Home": "الرئيسية"
    }
};

async function run() {
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error('❌ Source file not found: ' + SOURCE_FILE);
        process.exit(1);
    }

    const sourceStrings = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
    console.log(`INPUT: ${sourceStrings.length} strings to process.`);

    for (const lang of TARGET_LANGS) {
        const outputFile = path.join(__dirname, `../src/i18n/${lang}.json`);
        const newTranslations = {};
        const dictionary = COMMON_DICTIONARY[lang] || {};

        console.log(`\n🌍 Generating ${lang.toUpperCase()} placeholders...`);

        for (const text of sourceStrings) {
            if (dictionary[text]) {
                // Use manual dictionary if available
                newTranslations[text] = dictionary[text];
            } else {
                // Fallback: [LANG] Original Text
                // This clearly shows i18n is "active" without needing an API
                newTranslations[text] = `[${lang.toUpperCase()}] ${text}`;
            }
        }

        fs.writeFileSync(outputFile, JSON.stringify(newTranslations, null, 2));
        console.log(`🎉 Saved ${outputFile}`);
    }
}

run().catch(console.error);
