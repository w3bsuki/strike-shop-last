#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Optimization Script
 * Removes unused dependencies and optimizes imports
 */

const UNUSED_DEPENDENCIES = [
  'critters', // 0 usages found
  'swiper', // 0 usages found
  'react-icons', // 0 usages found (using lucide-react instead)
];

const RARELY_USED_DEPENDENCIES = [
  'embla-carousel-react', // 1 usage - consider removing
  'react-resizable-panels', // 1 usage - consider removing
  'input-otp', // 1 usage - consider removing
  'react-day-picker', // 1 usage - consider removing
];

const OPTIMIZATION_REPORT = {
  removed: [],
  warnings: [],
  optimizations: [],
  metrics: {
    before: {},
    after: {},
  },
};

function getPackageSize(packageName) {
  try {
    const packagePath = path.join(process.cwd(), 'node_modules', packageName);
    if (!fs.existsSync(packagePath)) return 0;
    
    const stats = execSync(`du -sb ${packagePath}`, { encoding: 'utf-8' });
    return parseInt(stats.split('\t')[0]);
  } catch (error) {
    return 0;
  }
}

function getTotalNodeModulesSize() {
  try {
    const stats = execSync('du -sb node_modules', { encoding: 'utf-8' });
    return parseInt(stats.split('\t')[0]);
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function optimizeBundle() {
  console.log('🚀 Starting bundle optimization...\n');

  // Measure initial size
  OPTIMIZATION_REPORT.metrics.before.nodeModulesSize = getTotalNodeModulesSize();
  console.log(`📦 Initial node_modules size: ${formatBytes(OPTIMIZATION_REPORT.metrics.before.nodeModulesSize)}\n`);

  // 1. Remove unused dependencies
  console.log('🗑️  Removing unused dependencies...');
  for (const dep of UNUSED_DEPENDENCIES) {
    const size = getPackageSize(dep);
    if (size > 0) {
      console.log(`   - Removing ${dep} (${formatBytes(size)})`);
      try {
        execSync(`npm uninstall ${dep}`, { stdio: 'pipe' });
        OPTIMIZATION_REPORT.removed.push({ package: dep, size });
      } catch (error) {
        console.error(`   ❌ Failed to remove ${dep}: ${error.message}`);
      }
    }
  }

  // 2. Warn about rarely used dependencies
  console.log('\n⚠️  Rarely used dependencies (consider removing):');
  for (const dep of RARELY_USED_DEPENDENCIES) {
    const size = getPackageSize(dep);
    if (size > 0) {
      console.log(`   - ${dep} (${formatBytes(size)}) - Only 1 usage found`);
      OPTIMIZATION_REPORT.warnings.push({ package: dep, size, usage: 1 });
    }
  }

  // 3. Optimize imports
  console.log('\n🔧 Optimizing imports...');
  
  // Create import optimization map
  const importOptimizations = {
    'lodash': 'lodash-es',
    '@radix-ui/react-slot': '@radix-ui/react-slot/dist/index.js',
  };

  // 4. Update next.config.mjs with more aggressive optimizations
  console.log('\n📝 Updating Next.js configuration...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
  let nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
  
  // Add modularizeImports configuration
  const modularizeImportsConfig = `
  // Modularize imports for better tree-shaking
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },`;

  // Insert modularizeImports after experimental block
  if (!nextConfig.includes('modularizeImports')) {
    nextConfig = nextConfig.replace(
      /experimental: {[^}]+},/s,
      (match) => match + modularizeImportsConfig
    );
    fs.writeFileSync(nextConfigPath, nextConfig);
    OPTIMIZATION_REPORT.optimizations.push('Added modularizeImports configuration');
  }

  // 5. Create optimized imports helper
  console.log('\n📄 Creating import optimization helper...');
  
  const importHelperContent = `/**
 * Optimized imports for common libraries
 * Use these imports instead of direct imports for better tree-shaking
 */

// Instead of: import { debounce } from 'lodash'
// Use: import debounce from 'lodash/debounce'

// Instead of: import { Dialog } from '@radix-ui/react-dialog'
// Use the existing shadcn/ui components which already optimize Radix imports

// For icons, use specific imports:
// Instead of: import { ChevronRight } from 'lucide-react'
// The modularizeImports config will handle this automatically

export const importGuidelines = {
  lodash: 'Use specific imports like lodash/debounce',
  radixUI: 'Use shadcn/ui components instead of direct Radix imports',
  icons: 'Import icons individually, tree-shaking is automatic',
  reactQuery: 'Import only what you need from @tanstack/react-query',
};
`;

  fs.writeFileSync(
    path.join(process.cwd(), 'lib', 'import-optimizations.ts'),
    importHelperContent
  );

  // 6. Add bundle size check script to package.json
  console.log('\n📋 Adding bundle size check to package.json...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  packageJson.scripts['bundle:check'] = 'node scripts/analyze-bundle.js';
  packageJson.scripts['bundle:optimize'] = 'node scripts/optimize-bundle.js';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // 7. Measure final size
  console.log('\n📊 Measuring optimization results...');
  execSync('npm install', { stdio: 'pipe' }); // Ensure node_modules is updated
  
  OPTIMIZATION_REPORT.metrics.after.nodeModulesSize = getTotalNodeModulesSize();
  
  const sizeSaved = OPTIMIZATION_REPORT.metrics.before.nodeModulesSize - OPTIMIZATION_REPORT.metrics.after.nodeModulesSize;
  const percentSaved = ((sizeSaved / OPTIMIZATION_REPORT.metrics.before.nodeModulesSize) * 100).toFixed(2);

  // 8. Generate report
  console.log('\n📈 Optimization Report:');
  console.log('====================\n');
  
  console.log('❌ Removed packages:');
  OPTIMIZATION_REPORT.removed.forEach(item => {
    console.log(`   - ${item.package}: ${formatBytes(item.size)}`);
  });
  
  console.log('\n⚠️  Consider removing (rarely used):');
  OPTIMIZATION_REPORT.warnings.forEach(item => {
    console.log(`   - ${item.package}: ${formatBytes(item.size)} (${item.usage} usage)`);
  });
  
  console.log('\n✅ Optimizations applied:');
  OPTIMIZATION_REPORT.optimizations.forEach(opt => {
    console.log(`   - ${opt}`);
  });
  
  console.log('\n📦 Bundle size metrics:');
  console.log(`   Before: ${formatBytes(OPTIMIZATION_REPORT.metrics.before.nodeModulesSize)}`);
  console.log(`   After: ${formatBytes(OPTIMIZATION_REPORT.metrics.after.nodeModulesSize)}`);
  console.log(`   Saved: ${formatBytes(sizeSaved)} (${percentSaved}%)`);
  
  console.log('\n💡 Next steps:');
  console.log('   1. Run "npm run build:analyze" to check bundle chunks');
  console.log('   2. Consider removing rarely used dependencies listed above');
  console.log('   3. Use dynamic imports for heavy components');
  console.log('   4. Check lib/import-optimizations.ts for import guidelines');
  
  // Save report
  fs.writeFileSync(
    path.join(process.cwd(), 'optimization-report.json'),
    JSON.stringify(OPTIMIZATION_REPORT, null, 2)
  );
  
  console.log('\n📝 Full report saved to optimization-report.json');
}

// Run optimization
optimizeBundle().catch(console.error);