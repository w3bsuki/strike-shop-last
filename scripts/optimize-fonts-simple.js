#!/usr/bin/env node

/**
 * Simple Font Optimization Script for Strike Shop
 * Uses npm packages for cross-platform compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const FONT_DIR = path.join(__dirname, '..', 'public', 'fonts');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fonts', 'optimized');

async function installPackages() {
  console.log('📦 Installing font optimization packages...');
  try {
    execSync('npm install --no-save ttf2woff2 subset-font', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Failed to install packages:', error.message);
    return false;
  }
}

async function convertAndOptimize() {
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Load modules after installation
  let ttf2woff2, subsetFont;
  try {
    ttf2woff2 = require('ttf2woff2');
    subsetFont = require('subset-font');
  } catch (error) {
    console.error('Required packages not found. Please run: npm install ttf2woff2 subset-font');
    return;
  }
  
  const fonts = [
    { name: 'CourierPrime-Regular', file: 'CourierPrime-Regular.ttf' },
    { name: 'CourierPrime-Bold', file: 'CourierPrime-Bold.ttf' }
  ];
  
  const results = [];
  
  for (const font of fonts) {
    console.log(`\n🔧 Processing ${font.name}...`);
    
    try {
      const inputPath = path.join(FONT_DIR, font.file);
      const outputPath = path.join(OUTPUT_DIR, font.file.replace('.ttf', '.woff2'));
      
      // Read TTF file
      const ttfBuffer = await fs.readFile(inputPath);
      const originalSize = ttfBuffer.length;
      console.log(`  Original size: ${(originalSize / 1024).toFixed(2)} KB`);
      
      // Convert to WOFF2
      console.log(`  Converting to WOFF2...`);
      const woff2Buffer = ttf2woff2(ttfBuffer);
      
      // Subset the font (Latin characters only)
      console.log(`  Subsetting font...`);
      const subsetBuffer = await subsetFont(woff2Buffer, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~', {
        targetFormat: 'woff2'
      });
      
      // Write optimized font
      await fs.writeFile(outputPath, subsetBuffer);
      
      const finalSize = subsetBuffer.length;
      const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
      
      console.log(`  ✅ Optimized size: ${(finalSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
      
      results.push({
        font: font.name,
        originalSize,
        optimizedSize: finalSize,
        reduction: `${reduction}%`
      });
      
    } catch (error) {
      console.error(`  ❌ Error processing ${font.name}:`, error.message);
      results.push({
        font: font.name,
        error: error.message
      });
    }
  }
  
  // Generate CSS
  console.log('\n📝 Generating optimized CSS...');
  const cssContent = `/* Optimized Fonts - Strike Shop */
@font-face {
  font-family: 'Typewriter';
  src: url('/fonts/optimized/CourierPrime-Regular.woff2') format('woff2'),
       url('/fonts/CourierPrime-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Typewriter';
  src: url('/fonts/optimized/CourierPrime-Bold.woff2') format('woff2'),
       url('/fonts/CourierPrime-Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}`;

  await fs.writeFile(path.join(__dirname, '..', 'styles', 'fonts-optimized.css'), cssContent);
  
  console.log('\n✨ Font optimization complete!');
  console.table(results);
}

// Run the script
(async () => {
  const packagesInstalled = await installPackages();
  if (packagesInstalled) {
    await convertAndOptimize();
  }
})();