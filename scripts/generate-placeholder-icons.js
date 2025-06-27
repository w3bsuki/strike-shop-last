#!/usr/bin/env node

/**
 * Generate placeholder PWA icons for Strike Shop
 */

const fs = require('fs').promises;
const path = require('path');

const ICON_SIZES = [
  72, 96, 128, 144, 152, 192, 384, 512
];

const APPLE_SIZES = [
  120, 152, 180
];

async function generatePlaceholderIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  
  try {
    await fs.mkdir(iconsDir, { recursive: true });
    
    // Create a simple SVG as base
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="256" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff">S</text>
</svg>`;
    
    // Save base SVG
    await fs.writeFile(path.join(iconsDir, 'icon.svg'), svgContent.trim());
    
    // For now, create placeholder text files for each size
    // In production, these would be actual PNG files generated from the SVG
    for (const size of ICON_SIZES) {
      const filename = `icon-${size}x${size}.png`;
      await fs.writeFile(
        path.join(iconsDir, filename),
        `Placeholder for ${size}x${size} icon - Replace with actual PNG`
      );
      console.log(`Created placeholder: ${filename}`);
    }
    
    // Apple touch icons
    for (const size of APPLE_SIZES) {
      const filename = `apple-touch-icon-${size}x${size}.png`;
      await fs.writeFile(
        path.join(iconsDir, filename),
        `Placeholder for Apple ${size}x${size} icon - Replace with actual PNG`
      );
      console.log(`Created placeholder: ${filename}`);
    }
    
    // Maskable icons
    await fs.writeFile(
      path.join(iconsDir, 'maskable-icon-192x192.png'),
      'Placeholder for maskable icon 192x192 - Replace with actual PNG'
    );
    await fs.writeFile(
      path.join(iconsDir, 'maskable-icon-512x512.png'),
      'Placeholder for maskable icon 512x512 - Replace with actual PNG'
    );
    
    // Shortcut icons
    const shortcuts = ['new-96x96.png', 'categories-96x96.png', 'cart-96x96.png'];
    for (const shortcut of shortcuts) {
      await fs.writeFile(
        path.join(iconsDir, shortcut),
        `Placeholder for ${shortcut} - Replace with actual PNG`
      );
      console.log(`Created placeholder: ${shortcut}`);
    }
    
    console.log('\n✅ Placeholder icons created successfully!');
    console.log('\n⚠️  IMPORTANT: Replace these placeholder files with actual PNG images before production!');
    console.log('You can use the generate-pwa-icons.js script with a source image to create real icons.');
    
  } catch (error) {
    console.error('Error creating placeholder icons:', error);
    process.exit(1);
  }
}

generatePlaceholderIcons();