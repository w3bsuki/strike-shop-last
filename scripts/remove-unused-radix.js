#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Script to remove unused Radix UI components
 * Based on analysis, these components are used in 2 files or less
 */

const UNUSED_RADIX_COMPONENTS = [
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-switch',
  '@radix-ui/react-toggle-group',
];

const RARELY_USED_RADIX_COMPONENTS = [
  '@radix-ui/react-checkbox',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-tabs',
  '@radix-ui/react-tooltip',
];

console.log('🧹 Removing unused Radix UI components...\n');

let totalRemoved = 0;

// Remove unused components
UNUSED_RADIX_COMPONENTS.forEach(component => {
  try {
    console.log(`📦 Removing ${component}...`);
    execSync(`npm uninstall ${component}`, { stdio: 'pipe' });
    totalRemoved++;
  } catch (error) {
    console.log(`⚠️  ${component} not found or already removed`);
  }
});

console.log(`\n✅ Removed ${totalRemoved} unused Radix UI components`);

// Report rarely used components
console.log('\n⚠️  The following Radix UI components are rarely used (consider removing):');
RARELY_USED_RADIX_COMPONENTS.forEach(component => {
  console.log(`   - ${component}`);
});

console.log('\n💡 Next steps:');
console.log('1. Update the UI component files to handle removed dependencies');
console.log('2. Consider replacing rarely used components with simpler alternatives');
console.log('3. Run npm install to update package-lock.json');
console.log('4. Test the application thoroughly');