#!/usr/bin/env node

/**
 * Bundle Size Checker for Strike Shop
 * Monitors bundle sizes and alerts when they exceed targets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle size targets (in KB)
const TARGETS = {
  'main': 50,
  'framework': 100,
  'main-app': 50,
  'app/layout': 300, // Total initial load target
  'app/page': 250,
  'app/[category]/page': 200,
  'app/product/[slug]/page': 200,
  'app/checkout/page': 200,
  'app/admin/page': 150,
  // Lazy loaded chunks (less critical)
  'framer-motion': 150,
  'recharts': 200,
  'sanity': 2000,
  'clerk': 100,
};

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function formatSize(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function checkBundleSize() {
  console.log(`${colors.blue}🔍 Checking bundle sizes...${colors.reset}\n`);

  try {
    // Build the project
    console.log('Building project...');
    execSync('npm run build', { stdio: 'inherit' });

    // Read the build manifest
    const buildManifest = path.join(__dirname, '../.next/build-manifest.json');
    const appBuildManifest = path.join(__dirname, '../.next/app-build-manifest.json');
    
    if (!fs.existsSync(buildManifest)) {
      console.error(`${colors.red}Build manifest not found. Please run 'npm run build' first.${colors.reset}`);
      process.exit(1);
    }

    // Analyze chunk sizes
    const statsPath = path.join(__dirname, '../.next');
    const chunks = new Map();
    
    // Get all JS files in the chunks directory
    const chunksDir = path.join(statsPath, 'static/chunks');
    
    function getFilesRecursively(dir) {
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getFilesRecursively(fullPath));
        } else if (item.endsWith('.js')) {
          files.push({ path: fullPath, name: item });
        }
      }
      
      return files;
    }
    
    const jsFiles = getFilesRecursively(chunksDir);
    
    // Calculate sizes
    let totalSize = 0;
    let criticalSize = 0;
    const results = [];
    
    for (const file of jsFiles) {
      const stats = fs.statSync(file.path);
      const size = stats.size;
      const name = file.name.replace(/\.[a-f0-9]+\.js$/, '');
      
      totalSize += size;
      
      // Check if it's a critical chunk
      const isCritical = ['main', 'framework', 'main-app', 'webpack', 'pages/_app'].some(
        critical => name.includes(critical)
      );
      
      if (isCritical) {
        criticalSize += size;
      }
      
      results.push({
        name,
        size,
        isCritical,
        target: TARGETS[name] ? TARGETS[name] * 1024 : null,
      });
    }
    
    // Sort by size
    results.sort((a, b) => b.size - a.size);
    
    // Display results
    console.log(`${colors.blue}📊 Bundle Size Report${colors.reset}\n`);
    console.log(`Total Bundle Size: ${formatSize(totalSize)}`);
    console.log(`Critical Bundle Size: ${formatSize(criticalSize)}`);
    console.log(`Target Bundle Size: 300 KB\n`);
    
    console.log('Top 10 Largest Chunks:');
    console.log('─'.repeat(60));
    
    let hasViolations = false;
    
    for (let i = 0; i < Math.min(10, results.length); i++) {
      const chunk = results[i];
      const sizeStr = formatSize(chunk.size);
      
      let status = colors.green + '✓' + colors.reset;
      let color = colors.green;
      
      if (chunk.target && chunk.size > chunk.target) {
        status = colors.red + '✗' + colors.reset;
        color = colors.red;
        hasViolations = true;
      } else if (chunk.target && chunk.size > chunk.target * 0.9) {
        status = colors.yellow + '⚠' + colors.reset;
        color = colors.yellow;
      }
      
      console.log(
        `${status} ${chunk.name.padEnd(30)} ${color}${sizeStr.padStart(12)}${colors.reset}${
          chunk.target ? ` (target: ${formatSize(chunk.target)})` : ''
        }`
      );
    }
    
    console.log('─'.repeat(60));
    
    // Check overall target
    if (criticalSize > 300 * 1024) {
      console.log(`\n${colors.red}❌ Critical bundle size exceeds 300KB target!${colors.reset}`);
      console.log(`   Current: ${formatSize(criticalSize)}`);
      console.log(`   Target: 300 KB`);
      console.log(`   Excess: ${formatSize(criticalSize - 300 * 1024)}\n`);
      hasViolations = true;
    } else {
      console.log(`\n${colors.green}✅ Critical bundle size is within target!${colors.reset}`);
      console.log(`   Current: ${formatSize(criticalSize)}`);
      console.log(`   Target: 300 KB`);
      console.log(`   Margin: ${formatSize(300 * 1024 - criticalSize)}\n`);
    }
    
    // Recommendations
    if (hasViolations) {
      console.log(`${colors.yellow}💡 Recommendations:${colors.reset}`);
      console.log('1. Use dynamic imports for heavy components');
      console.log('2. Implement code splitting for routes');
      console.log('3. Tree-shake unused exports');
      console.log('4. Consider lazy loading non-critical features');
      console.log('5. Run "npm run analyze" for detailed bundle analysis\n');
    }
    
    // Exit with error if violations found
    if (hasViolations && process.env.CI) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error checking bundle size:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run the checker
checkBundleSize();