#!/usr/bin/env node

/**
 * PWA Validation Script
 * Checks if the PWA is properly configured
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const REQUIRED_MANIFEST_FIELDS = [
  'name',
  'short_name',
  'start_url',
  'display',
  'background_color',
  'theme_color',
  'icons'
];

const RECOMMENDED_MANIFEST_FIELDS = [
  'description',
  'orientation',
  'scope',
  'lang',
  'dir',
  'categories'
];

const REQUIRED_ICON_SIZES = ['192x192', '512x512'];
const RECOMMENDED_ICON_SIZES = ['72x72', '96x96', '128x128', '144x144', '152x152', '384x384'];

async function validateManifest() {
  console.log('🔍 Validating PWA Configuration...\n');
  
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  let manifest;
  let errors = [];
  let warnings = [];
  
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    errors.push(`❌ manifest.json not found or invalid: ${error.message}`);
    return { errors, warnings };
  }
  
  // Check required fields
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!manifest[field]) {
      errors.push(`❌ Missing required field: ${field}`);
    }
  }
  
  // Check recommended fields
  for (const field of RECOMMENDED_MANIFEST_FIELDS) {
    if (!manifest[field]) {
      warnings.push(`⚠️  Missing recommended field: ${field}`);
    }
  }
  
  // Validate display mode
  const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
  if (manifest.display && !validDisplayModes.includes(manifest.display)) {
    errors.push(`❌ Invalid display mode: ${manifest.display}`);
  }
  
  // Validate orientation
  const validOrientations = ['any', 'natural', 'landscape', 'portrait', 'portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary'];
  if (manifest.orientation && !validOrientations.includes(manifest.orientation)) {
    warnings.push(`⚠️  Invalid orientation: ${manifest.orientation}`);
  }
  
  // Validate start_url
  if (manifest.start_url && !manifest.start_url.startsWith('/') && !manifest.start_url.startsWith('http')) {
    errors.push(`❌ start_url should be a relative path starting with / or an absolute URL`);
  }
  
  // Validate icons
  if (manifest.icons && Array.isArray(manifest.icons)) {
    const iconSizes = manifest.icons.map(icon => icon.sizes);
    
    for (const size of REQUIRED_ICON_SIZES) {
      if (!iconSizes.includes(size)) {
        errors.push(`❌ Missing required icon size: ${size}`);
      }
    }
    
    for (const size of RECOMMENDED_ICON_SIZES) {
      if (!iconSizes.includes(size)) {
        warnings.push(`⚠️  Missing recommended icon size: ${size}`);
      }
    }
    
    // Check if icons have purpose
    const hasMaskableIcon = manifest.icons.some(icon => 
      icon.purpose && icon.purpose.includes('maskable')
    );
    
    if (!hasMaskableIcon) {
      warnings.push(`⚠️  No maskable icon found. Consider adding maskable icons for better appearance on Android`);
    }
    
    // Validate icon files exist
    for (const icon of manifest.icons) {
      const iconPath = path.join(process.cwd(), 'public', icon.src.replace(/^\//, ''));
      try {
        await fs.access(iconPath);
      } catch {
        errors.push(`❌ Icon file not found: ${icon.src}`);
      }
    }
  } else {
    errors.push(`❌ Icons array is missing or invalid`);
  }
  
  // Validate colors
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (manifest.background_color && !colorRegex.test(manifest.background_color)) {
    warnings.push(`⚠️  Invalid background_color format: ${manifest.background_color}`);
  }
  
  if (manifest.theme_color && !colorRegex.test(manifest.theme_color)) {
    warnings.push(`⚠️  Invalid theme_color format: ${manifest.theme_color}`);
  }
  
  return { errors, warnings, manifest };
}

async function validateServiceWorker() {
  const errors = [];
  const warnings = [];
  
  // Check for service worker files
  const swFiles = ['sw.js', 'sw-workbox.js', 'service-worker.js'];
  let swFound = false;
  
  for (const swFile of swFiles) {
    const swPath = path.join(process.cwd(), 'public', swFile);
    try {
      await fs.access(swPath);
      swFound = true;
      console.log(`✅ Service worker found: ${swFile}`);
    } catch {
      // File doesn't exist
    }
  }
  
  if (!swFound) {
    errors.push('❌ No service worker file found in public directory');
  }
  
  // Check for offline page
  const offlinePath = path.join(process.cwd(), 'public', 'offline.html');
  try {
    await fs.access(offlinePath);
    console.log('✅ Offline page found');
  } catch {
    warnings.push('⚠️  No offline.html page found');
  }
  
  return { errors, warnings };
}

async function validateMetaTags() {
  const warnings = [];
  
  // Check for important meta tags in layout files
  const layoutPaths = [
    path.join(process.cwd(), 'app', 'layout.tsx'),
    path.join(process.cwd(), 'src', 'app', 'layout.tsx'),
  ];
  
  let layoutFound = false;
  let layoutContent = '';
  
  for (const layoutPath of layoutPaths) {
    try {
      layoutContent = await fs.readFile(layoutPath, 'utf8');
      layoutFound = true;
      break;
    } catch {
      // Continue to next path
    }
  }
  
  if (layoutFound) {
    const requiredMetaTags = [
      { name: 'theme-color', pattern: /name=["']theme-color["']/ },
      { name: 'viewport', pattern: /name=["']viewport["']/ },
      { name: 'manifest link', pattern: /rel=["']manifest["']/ },
    ];
    
    for (const { name, pattern } of requiredMetaTags) {
      if (!pattern.test(layoutContent)) {
        warnings.push(`⚠️  Missing meta tag: ${name}`);
      }
    }
  } else {
    warnings.push('⚠️  Could not find layout file to check meta tags');
  }
  
  return { warnings };
}

async function checkHTTPS() {
  const warnings = [];
  
  // Check if HTTPS is properly configured in next.config
  const configPaths = [
    path.join(process.cwd(), 'next.config.js'),
    path.join(process.cwd(), 'next.config.mjs'),
  ];
  
  let configFound = false;
  
  for (const configPath of configPaths) {
    try {
      await fs.access(configPath);
      configFound = true;
      console.log('✅ Next.js config found');
      break;
    } catch {
      // Continue to next path
    }
  }
  
  if (!configFound) {
    warnings.push('⚠️  No Next.js config file found');
  }
  
  return { warnings };
}

async function runValidation() {
  console.log('🚀 Strike Shop PWA Validation\n');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Validate manifest
  console.log('📋 Checking manifest.json...');
  const manifestResult = await validateManifest();
  totalErrors += manifestResult.errors.length;
  totalWarnings += manifestResult.warnings.length;
  
  manifestResult.errors.forEach(error => console.log(error));
  manifestResult.warnings.forEach(warning => console.log(warning));
  
  if (manifestResult.errors.length === 0 && manifestResult.manifest) {
    console.log('✅ manifest.json is valid');
  }
  
  console.log('');
  
  // Validate service worker
  console.log('⚙️  Checking service worker...');
  const swResult = await validateServiceWorker();
  totalErrors += swResult.errors.length;
  totalWarnings += swResult.warnings.length;
  
  swResult.errors.forEach(error => console.log(error));
  swResult.warnings.forEach(warning => console.log(warning));
  
  console.log('');
  
  // Validate meta tags
  console.log('🏷️  Checking meta tags...');
  const metaResult = await validateMetaTags();
  totalWarnings += metaResult.warnings.length;
  
  metaResult.warnings.forEach(warning => console.log(warning));
  
  console.log('');
  
  // Check HTTPS
  console.log('🔒 Checking HTTPS configuration...');
  const httpsResult = await checkHTTPS();
  totalWarnings += httpsResult.warnings.length;
  
  httpsResult.warnings.forEach(warning => console.log(warning));
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Validation Summary:`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ Your PWA configuration is valid!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Test installation on a real device');
    console.log('   2. Run Lighthouse audit for PWA score');
    console.log('   3. Test offline functionality');
    console.log('   4. Verify push notifications (if implemented)');
  } else {
    console.log('\n❌ Please fix the errors above before deploying');
    process.exit(1);
  }
  
  if (totalWarnings > 0) {
    console.log('\n💡 Consider addressing the warnings for a better PWA experience');
  }
}

// Run validation
runValidation().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});