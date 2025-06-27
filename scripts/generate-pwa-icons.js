#!/usr/bin/env node

/**
 * Script to generate PWA icons from a base image
 * Usage: node scripts/generate-pwa-icons.js [path-to-source-image]
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

const APPLE_ICON_SIZES = [
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
];

const MASKABLE_SIZES = [
  { size: 192, name: 'maskable-icon-192x192.png' },
  { size: 512, name: 'maskable-icon-512x512.png' },
];

async function generateIcons(sourcePath) {
  const outputDir = path.join(process.cwd(), 'public', 'icons');
  
  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Check if source file exists
    await fs.access(sourcePath);
    
    console.log(`Generating PWA icons from: ${sourcePath}`);
    console.log(`Output directory: ${outputDir}`);
    
    // Generate standard icons
    for (const { size, name } of ICON_SIZES) {
      const outputPath = path.join(outputDir, name);
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name}`);
    }
    
    // Generate Apple touch icons
    for (const { size, name } of APPLE_ICON_SIZES) {
      const outputPath = path.join(outputDir, name);
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name}`);
    }
    
    // Generate maskable icons with safe area padding
    for (const { size, name } of MASKABLE_SIZES) {
      const outputPath = path.join(outputDir, name);
      const paddedSize = Math.floor(size * 0.8); // 80% of size for safe area
      const padding = Math.floor((size - paddedSize) / 2);
      
      await sharp(sourcePath)
        .resize(paddedSize, paddedSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (maskable)`);
    }
    
    // Generate favicon.ico (multi-resolution)
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32)
      .toFile(faviconPath);
    console.log('✓ Generated favicon.ico');
    
    // Generate additional shortcut icons
    const shortcutIcons = [
      { name: 'new-96x96.png', color: '#10b981' }, // green
      { name: 'categories-96x96.png', color: '#3b82f6' }, // blue
      { name: 'cart-96x96.png', color: '#f59e0b' }, // orange
    ];
    
    for (const { name, color } of shortcutIcons) {
      const outputPath = path.join(outputDir, name);
      await sharp({
        create: {
          width: 96,
          height: 96,
          channels: 4,
          background: color
        }
      })
      .composite([{
        input: await sharp(sourcePath)
          .resize(64, 64)
          .toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
      console.log(`✓ Generated ${name}`);
    }
    
    console.log('\n✅ All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Update manifest.json with the correct icon paths');
    console.log('2. Add meta tags for Apple touch icons in your HTML');
    console.log('3. Test the PWA installation on different devices');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const sourcePath = args[0] || path.join(process.cwd(), 'public', 'placeholder-logo.png');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('Sharp is not installed. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
}

// Run the script
generateIcons(sourcePath);