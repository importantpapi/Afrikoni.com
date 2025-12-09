/**
 * Convert OG Image SVG to PNG
 * 
 * This script attempts to convert og-image.svg to og-image.png
 * 
 * Requirements:
 * - Option 1: Install sharp: npm install sharp --save-dev
 * - Option 2: Install puppeteer: npm install puppeteer --save-dev
 * - Option 3: Use online converter (manual)
 * 
 * Usage: node scripts/convert-og-image.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(process.cwd(), 'public', 'og-image.svg');
const pngPath = path.join(process.cwd(), 'public', 'og-image.png');

async function convertImage() {
  console.log('🖼️  OG Image Converter\n');
  console.log('=' .repeat(50));
  console.log('');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error('❌ Error: og-image.svg not found at:', svgPath);
    process.exit(1);
  }

  console.log('✅ Found og-image.svg');

  // Try to use sharp (if available)
  try {
    const sharp = (await import('sharp')).default;
    console.log('✅ Sharp library found - Converting...');
    
    await sharp(svgPath)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 96, g: 56, b: 19, alpha: 1 } // #603813
      })
      .png()
      .toFile(pngPath);
    
    console.log('✅ Successfully converted to og-image.png');
    console.log('📁 Location:', pngPath);
    console.log('');
    console.log('🎉 Done! Your OG image is ready.');
    return;
  } catch (sharpErr) {
    // Sharp not available or conversion failed
    if (sharpErr.code === 'MODULE_NOT_FOUND') {
      // Sharp not installed, try puppeteer
      try {
        const puppeteer = (await import('puppeteer')).default;
        console.log('✅ Puppeteer library found - Converting...');
        
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Set viewport to OG image size
        await page.setViewport({ width: 1200, height: 630 });
        
        // Load SVG
        const svgContent = fs.readFileSync(svgPath, 'utf8');
        await page.setContent(`<div style="width: 1200px; height: 630px;">${svgContent}</div>`);
        
        // Take screenshot
        await page.screenshot({
          path: pngPath,
          width: 1200,
          height: 630,
          clip: { x: 0, y: 0, width: 1200, height: 630 }
        });
        
        await browser.close();
        
        console.log('✅ Successfully converted to og-image.png');
        console.log('📁 Location:', pngPath);
        console.log('');
        console.log('🎉 Done! Your OG image is ready.');
        return;
      } catch (puppeteerErr) {
        // Neither library available
        console.log('⚠️  No image conversion libraries found.');
        console.log('');
        console.log('📦 To install conversion library:');
        console.log('   Option 1: npm install sharp --save-dev');
        console.log('   Option 2: npm install puppeteer --save-dev');
        console.log('');
        console.log('💡 Or use manual conversion:');
        console.log('   1. Go to https://cloudconvert.com/svg-to-png');
        console.log('   2. Upload public/og-image.svg');
        console.log('   3. Set size: 1200x630px');
        console.log('   4. Download as public/og-image.png');
        console.log('');
        console.log('📖 See: public/OG_IMAGE_INSTRUCTIONS.md for details');
      }
    } else {
      // Sharp conversion failed
      console.error('❌ Error converting with sharp:', sharpErr.message);
      console.log('');
      console.log('💡 Alternative: Use online converter or design tool');
      console.log('   See: public/OG_IMAGE_INSTRUCTIONS.md');
    }
  }
}

convertImage().catch(console.error);
