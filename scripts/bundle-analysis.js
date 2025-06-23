#!/usr/bin/env node

/**
 * COMPREHENSIVE BUNDLE ANALYSIS SCRIPT
 * Analyzes bundle size, dependencies, and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function analyzeNodeModules() {
  console.log('📊 COMPREHENSIVE BUNDLE ANALYSIS');
  console.log('=' .repeat(50));
  
  // Current node_modules size
  const currentSize = execSync('du -sh node_modules/', { encoding: 'utf8' }).split('\t')[0];
  console.log(`📦 Current node_modules size: ${currentSize}`);
  
  // Top 20 largest packages
  console.log('\n🔍 TOP 20 LARGEST PACKAGES:');
  const largest = execSync('du -sh node_modules/*/ | sort -hr | head -20', { encoding: 'utf8' });
  console.log(largest);
  
  // Package count
  const packageCount = execSync('ls node_modules | wc -l', { encoding: 'utf8' }).trim();
  console.log(`📋 Total packages: ${packageCount}`);
}

function analyzeProductionBundleSize() {
  console.log('\n🏗️  PRODUCTION BUNDLE ANALYSIS:');
  
  try {
    // Check if build exists
    if (fs.existsSync('.next')) {
      const buildSize = execSync('du -sh .next/', { encoding: 'utf8' }).split('\t')[0];
      console.log(`📁 Build output size: ${buildSize}`);
      
      // Analyze chunks if they exist
      if (fs.existsSync('.next/static/chunks')) {
        console.log('\n📋 CHUNK ANALYSIS:');
        const chunks = execSync('find .next/static/chunks -name "*.js" | head -10', { encoding: 'utf8' });
        if (chunks.trim()) {
          execSync('find .next/static/chunks -name "*.js" -exec du -h {} \\; | sort -hr | head -10', { stdio: 'inherit' });
        }
      }
    } else {
      console.log('❌ No build found. Run "npm run build" first.');
    }
  } catch (error) {
    console.log('❌ Error analyzing build:', error.message);
  }
}

function analyzeImportPatterns() {
  console.log('\n🔍 IMPORT PATTERN ANALYSIS:');
  
  try {
    // Find barrel imports (bad for tree-shaking)
    const barrelImports = execSync(`
      find app components lib hooks -name "*.tsx" -o -name "*.ts" | 
      xargs grep -h "import.*from" | 
      grep -E "(import \\* |import \\{[^}]{50,}\\})" | 
      sort | uniq -c | sort -nr | head -10
    `, { encoding: 'utf8' });
    
    if (barrelImports.trim()) {
      console.log('⚠️  POTENTIAL BARREL IMPORTS (bad for tree-shaking):');
      console.log(barrelImports);
    }
    
    // Find large imports
    const largeImports = execSync(`
      find app components lib hooks -name "*.tsx" -o -name "*.ts" | 
      xargs grep -h "from.*lucide-react\\|from.*@radix-ui\\|from.*@tanstack" | 
      sort | uniq -c | sort -nr | head -10
    `, { encoding: 'utf8' });
    
    if (largeImports.trim()) {
      console.log('\n📦 LARGE PACKAGE IMPORTS:');
      console.log(largeImports);
    }
  } catch (error) {
    console.log('❌ Error analyzing imports:', error.message);
  }
}

function calculateOptimizationPotential() {
  console.log('\n🎯 OPTIMIZATION POTENTIAL:');
  
  const packageJson = require('../package.json');
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`📊 Dependencies: ${dependencies.length} production, ${devDependencies.length} development`);
  
  // Calculate size of largest packages
  const largestPackages = [
    { name: '@next', size: '277M', optimization: 'Framework - cannot optimize' },
    { name: '@sanity', size: '124M', optimization: 'Move to external service or lazy load' },
    { name: 'sanity', size: '104M', optimization: 'Use production client only, lazy load studio' },
    { name: 'next', size: '103M', optimization: 'Framework core - minimal optimization possible' },
    { name: 'lucide-react', size: '31M', optimization: 'Use individual icon imports - 80% reduction possible' },
    { name: 'typescript', size: '23M', optimization: 'Development only - exclude from production' },
  ];
  
  console.log('\n🔧 OPTIMIZATION OPPORTUNITIES:');
  largestPackages.forEach(pkg => {
    console.log(`  📦 ${pkg.name} (${pkg.size}): ${pkg.optimization}`);
  });
  
  // Estimate total savings
  console.log('\n💰 ESTIMATED SAVINGS POTENTIAL:');
  console.log('  • Remove dev dependencies: ~45MB');
  console.log('  • Optimize Lucide icons: ~25MB');
  console.log('  • Lazy load Sanity Studio: ~104MB');
  console.log('  • Remove unused UI components: ~5MB');
  console.log('  • CDN externals: ~15MB');
  console.log('  ────────────────────────────');
  console.log('  📊 Total potential savings: ~194MB');
  console.log('  🎯 Target: 1.1GB → 200MB (600MB reduction needed)');
}

function generateOptimizationPlan() {
  console.log('\n📋 OPTIMIZATION PLAN:');
  console.log('1. ✅ Remove unused dependencies (DONE)');
  console.log('2. 🔄 Implement dynamic imports for heavy components');
  console.log('3. 📋 Optimize Lucide React imports');
  console.log('4. 📋 Remove unused UI components');
  console.log('5. 📋 Setup CDN externals for production');
  console.log('6. 📋 Create production-only package.json');
  console.log('7. 📋 Implement aggressive webpack optimization');
  console.log('8. 📋 Test and verify bundle sizes');
}

// Run analysis
if (require.main === module) {
  analyzeNodeModules();
  analyzeProductionBundleSize();
  analyzeImportPatterns();
  calculateOptimizationPotential();
  generateOptimizationPlan();
}