#!/usr/bin/env node

/**
 * AGGRESSIVE DEPENDENCY AUDIT SCRIPT
 * Analyzes and identifies unused dependencies for bundle optimization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJson = require('../package.json');

// Source directories to scan
const sourceDirs = ['app', 'components', 'lib', 'hooks', 'types', 'contexts'];

// File extensions to include
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

// Get all source files
function getAllFiles(dir, extension = fileExtensions) {
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

// Extract imports from file content
function extractImports(content) {
  const imports = new Set();
  
  // Match various import patterns
  const patterns = [
    /import\s+.*?from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const importPath = match[1];
      // Extract package name (handle scoped packages)
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        const packageName = importPath.startsWith('@') 
          ? importPath.split('/').slice(0, 2).join('/')
          : importPath.split('/')[0];
        imports.add(packageName);
      }
    }
  });
  
  return imports;
}

// Analyze dependency usage
function analyzeDependencies() {
  console.log('🔍 Starting aggressive dependency audit...\n');
  
  const allFiles = [];
  sourceDirs.forEach(dir => {
    allFiles.push(...getAllFiles(dir));
  });
  
  console.log(`📁 Scanning ${allFiles.length} files in ${sourceDirs.join(', ')}`);
  
  const usedPackages = new Set();
  
  // Scan all files for imports
  allFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const imports = extractImports(content);
      imports.forEach(pkg => usedPackages.add(pkg));
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}`);
    }
  });
  
  // Check package.json files
  const configs = ['next.config.mjs', 'tailwind.config.ts', 'jest.config.frontend.js'];
  configs.forEach(config => {
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', config), 'utf8');
      const imports = extractImports(content);
      imports.forEach(pkg => usedPackages.add(pkg));
    } catch (error) {
      // Config file might not exist
    }
  });
  
  // Analyze dependencies
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  const unusedDeps = dependencies.filter(dep => !usedPackages.has(dep));
  const unusedDevDeps = devDependencies.filter(dep => !usedPackages.has(dep));
  
  // Get package sizes
  function getPackageSize(packageName) {
    try {
      const result = execSync(`du -sh node_modules/${packageName} 2>/dev/null || echo "0"`, {
        encoding: 'utf8',
        timeout: 5000
      });
      return result.split('\t')[0] || '0';
    } catch {
      return '0';
    }
  }
  
  // Report results
  console.log('\n📊 DEPENDENCY AUDIT RESULTS');
  console.log('=' .repeat(50));
  
  console.log(`\n✅ Used dependencies: ${dependencies.length - unusedDeps.length}/${dependencies.length}`);
  console.log(`✅ Used dev dependencies: ${devDependencies.length - unusedDevDeps.length}/${devDependencies.length}`);
  
  if (unusedDeps.length > 0) {
    console.log(`\n🚨 UNUSED PRODUCTION DEPENDENCIES (${unusedDeps.length}):`);
    unusedDeps.forEach(dep => {
      const size = getPackageSize(dep);
      console.log(`  ❌ ${dep} (${size})`);
    });
  }
  
  if (unusedDevDeps.length > 0) {
    console.log(`\n⚠️  UNUSED DEV DEPENDENCIES (${unusedDevDeps.length}):`);
    unusedDevDeps.forEach(dep => {
      const size = getPackageSize(dep);
      console.log(`  ❌ ${dep} (${size})`);
    });
  }
  
  // Check for potential optimizations
  console.log('\n🎯 OPTIMIZATION OPPORTUNITIES:');
  
  // Check for large packages that could be optimized
  const largePackages = [
    '@sanity/client', '@sanity/vision', 'sanity',
    'date-fns', 'lucide-react', '@tanstack/react-query-devtools'
  ];
  
  largePackages.forEach(pkg => {
    if (usedPackages.has(pkg)) {
      const size = getPackageSize(pkg);
      console.log(`  📦 ${pkg} (${size}) - Consider optimization`);
    }
  });
  
  // Generate removal commands
  if (unusedDeps.length > 0 || unusedDevDeps.length > 0) {
    console.log('\n🔧 REMOVAL COMMANDS:');
    if (unusedDeps.length > 0) {
      console.log(`npm uninstall ${unusedDeps.join(' ')}`);
    }
    if (unusedDevDeps.length > 0) {
      console.log(`npm uninstall --save-dev ${unusedDevDeps.join(' ')}`);
    }
  }
  
  // Calculate potential savings
  let totalSavings = 0;
  [...unusedDeps, ...unusedDevDeps].forEach(dep => {
    const sizeStr = getPackageSize(dep);
    if (sizeStr.includes('M')) {
      totalSavings += parseFloat(sizeStr) || 0;
    }
  });
  
  console.log(`\n💰 POTENTIAL SAVINGS: ~${totalSavings.toFixed(1)}MB`);
  console.log(`🎯 TARGET: Reduce from 1.2GB to <200MB node_modules`);
  
  // Return results for programmatic use
  return {
    unusedDeps,
    unusedDevDeps,
    usedPackages: Array.from(usedPackages),
    totalSavings
  };
}

if (require.main === module) {
  analyzeDependencies();
}

module.exports = { analyzeDependencies };