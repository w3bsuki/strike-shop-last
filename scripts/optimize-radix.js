#!/usr/bin/env node

/**
 * RADIX UI OPTIMIZATION SCRIPT
 * Removes unused Radix UI components from package.json to reduce bundle size
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all source files
function getAllFiles(dir, extension = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  try {
    const items = fs.readdirSync(path.join(__dirname, '..', dir));
    for (const item of items) {
      const fullPath = path.join(__dirname, '..', dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(getAllFiles(path.join(dir, item), extension));
      } else if (extension.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  return files;
}

// Analyze which Radix UI components are actually used
function analyzeRadixUsage() {
  console.log('🔍 Analyzing Radix UI component usage...\n');
  
  const sourceDirs = ['app', 'components', 'lib', 'hooks'];
  const allFiles = [];
  
  sourceDirs.forEach(dir => {
    allFiles.push(...getAllFiles(dir));
  });
  
  // All Radix UI packages in package.json
  const packageJson = require('../package.json');
  const radixPackages = Object.keys(packageJson.dependencies).filter(pkg => 
    pkg.startsWith('@radix-ui/')
  );
  
  console.log(`📦 Found ${radixPackages.length} Radix UI packages in package.json`);
  
  // Find which ones are actually used
  const usedRadixPackages = new Set();
  
  allFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      radixPackages.forEach(pkg => {
        if (content.includes(pkg)) {
          usedRadixPackages.add(pkg);
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}`);
    }
  });
  
  const unusedRadixPackages = radixPackages.filter(pkg => !usedRadixPackages.has(pkg));
  
  console.log(`✅ Used Radix packages: ${usedRadixPackages.size}/${radixPackages.length}`);
  console.log(`❌ Unused Radix packages: ${unusedRadixPackages.length}\n`);
  
  if (unusedRadixPackages.length > 0) {
    console.log('🚨 UNUSED RADIX UI PACKAGES:');
    unusedRadixPackages.forEach(pkg => {
      try {
        const size = execSync(`du -sh node_modules/${pkg} 2>/dev/null || echo "0"`, {
          encoding: 'utf8',
          timeout: 5000
        }).split('\t')[0];
        console.log(`  ❌ ${pkg} (${size})`);
      } catch {
        console.log(`  ❌ ${pkg}`);
      }
    });
    
    console.log('\n🔧 REMOVAL COMMAND:');
    console.log(`npm uninstall ${unusedRadixPackages.join(' ')}`);
    
    // Calculate potential savings
    let totalSavings = 0;
    unusedRadixPackages.forEach(pkg => {
      try {
        const sizeStr = execSync(`du -sh node_modules/${pkg} 2>/dev/null || echo "0"`, {
          encoding: 'utf8',
          timeout: 5000
        }).split('\t')[0];
        if (sizeStr.includes('M')) {
          totalSavings += parseFloat(sizeStr) || 0;
        }
      } catch {}
    });
    
    console.log(`\n💰 POTENTIAL SAVINGS: ~${totalSavings.toFixed(1)}MB`);
    
    // Ask for confirmation to remove
    if (process.argv.includes('--remove')) {
      console.log('\n🗑️  Removing unused Radix UI packages...');
      try {
        execSync(`npm uninstall ${unusedRadixPackages.join(' ')}`, { stdio: 'inherit' });
        console.log('✅ Successfully removed unused Radix UI packages!');
      } catch (error) {
        console.error('❌ Failed to remove packages:', error.message);
      }
    } else {
      console.log('\n💡 To remove unused packages automatically, run:');
      console.log('node scripts/optimize-radix.js --remove');
    }
    
    return {
      total: radixPackages.length,
      used: usedRadixPackages.size,
      unused: unusedRadixPackages,
      savings: totalSavings
    };
  } else {
    console.log('✅ All Radix UI packages are being used!');
    console.log('\n🔍 However, we can optimize imports for better tree-shaking...');
    
    // Check which UI components are actually rendered
    console.log('\n📊 UI COMPONENT USAGE ANALYSIS:');
    const uiComponents = [
      'accordion', 'alert-dialog', 'aspect-ratio', 'avatar', 'checkbox',
      'collapsible', 'context-menu', 'dialog', 'dropdown-menu', 'hover-card',
      'label', 'menubar', 'navigation-menu', 'popover', 'progress',
      'radio-group', 'scroll-area', 'select', 'separator', 'slider',
      'switch', 'tabs', 'toast', 'toggle', 'toggle-group', 'tooltip'
    ];
    
    const usedComponents = [];
    const unusedComponents = [];
    
    allFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        uiComponents.forEach(component => {
          const componentUsed = content.includes(`components/ui/${component}`) ||
                               content.includes(`from '@/components/ui/${component}'`) ||
                               content.includes(`import("@/components/ui/${component}")`);
          if (componentUsed && !usedComponents.includes(component)) {
            usedComponents.push(component);
          }
        });
      } catch (error) {
        // Ignore file reading errors
      }
    });
    
    uiComponents.forEach(component => {
      if (!usedComponents.includes(component)) {
        unusedComponents.push(component);
      }
    });
    
    console.log(`✅ Used UI components: ${usedComponents.length}/${uiComponents.length}`);
    console.log(`❌ Potentially unused UI components: ${unusedComponents.length}`);
    
    if (unusedComponents.length > 0) {
      console.log('\n⚠️  POTENTIALLY UNUSED UI COMPONENTS:');
      unusedComponents.forEach(component => {
        console.log(`  ❓ ${component}`);
      });
      console.log('\n💡 Consider removing unused UI component files to reduce bundle size');
    }
    
    return {
      total: radixPackages.length,
      used: usedRadixPackages.size,
      unused: [],
      savings: 0,
      uiComponents: {
        used: usedComponents.length,
        unused: unusedComponents
      }
    };
  }
}

if (require.main === module) {
  analyzeRadixUsage();
}

module.exports = { analyzeRadixUsage };