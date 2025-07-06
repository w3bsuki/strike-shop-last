#!/usr/bin/env node
/**
 * Bundle Analysis Script for Perfect Refactor - Dependency Cleanup
 * Analyzes bundle composition and identifies optimization opportunities
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundleStructure() {
  console.log(`${colors.bold}${colors.cyan}📊 Bundle Analysis Report${colors.reset}\n`);
  
  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    console.log(`${colors.red}❌ No .next directory found. Run 'npm run build' first.${colors.reset}`);
    return;
  }

  // Analyze static files
  const staticDir = path.join(nextDir, 'static');
  if (fs.existsSync(staticDir)) {
    analyzeStaticAssets(staticDir);
  }

  // Analyze server chunks
  const serverDir = path.join(nextDir, 'server');
  if (fs.existsSync(serverDir)) {
    analyzeServerChunks(serverDir);
  }

  // Analyze client chunks
  const clientDir = path.join(nextDir, 'static', 'chunks');
  if (fs.existsSync(clientDir)) {
    analyzeClientChunks(clientDir);
  }

  // Generate recommendations
  generateOptimizationRecommendations();
}

function analyzeStaticAssets(staticDir) {
  console.log(`${colors.bold}${colors.blue}📁 Static Assets Analysis${colors.reset}`);
  
  const chunks = [];
  const cssFiles = [];
  const jsFiles = [];
  
  function traverseDirectory(dir, category = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverseDirectory(fullPath, item);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        const size = stat.size;
        
        if (ext === '.js') {
          jsFiles.push({ name: item, size, category });
        } else if (ext === '.css') {
          cssFiles.push({ name: item, size, category });
        }
      }
    }
  }
  
  traverseDirectory(staticDir);
  
  // Sort by size
  jsFiles.sort((a, b) => b.size - a.size);
  cssFiles.sort((a, b) => b.size - a.size);
  
  console.log(`\n${colors.yellow}JavaScript Files (Top 10):${colors.reset}`);
  jsFiles.slice(0, 10).forEach((file, index) => {
    const sizeColor = file.size > 100000 ? colors.red : file.size > 50000 ? colors.yellow : colors.green;
    console.log(`  ${index + 1}. ${file.name} - ${sizeColor}${formatBytes(file.size)}${colors.reset}`);
  });
  
  console.log(`\n${colors.yellow}CSS Files:${colors.reset}`);
  cssFiles.forEach((file, index) => {
    const sizeColor = file.size > 50000 ? colors.red : file.size > 20000 ? colors.yellow : colors.green;
    console.log(`  ${index + 1}. ${file.name} - ${sizeColor}${formatBytes(file.size)}${colors.reset}`);
  });
  
  const totalJS = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const totalCSS = cssFiles.reduce((sum, file) => sum + file.size, 0);
  
  console.log(`\n${colors.bold}📊 Summary:${colors.reset}`);
  console.log(`  Total JS: ${colors.cyan}${formatBytes(totalJS)}${colors.reset}`);
  console.log(`  Total CSS: ${colors.cyan}${formatBytes(totalCSS)}${colors.reset}`);
  console.log(`  Total Assets: ${colors.cyan}${formatBytes(totalJS + totalCSS)}${colors.reset}\n`);
}

function analyzeServerChunks(serverDir) {
  console.log(`${colors.bold}${colors.blue}🖥️  Server Chunks Analysis${colors.reset}`);
  
  const appDir = path.join(serverDir, 'app');
  if (fs.existsSync(appDir)) {
    const files = fs.readdirSync(appDir, { recursive: true });
    const jsFiles = files
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const fullPath = path.join(appDir, file);
        const stat = fs.statSync(fullPath);
        return { name: file, size: stat.size };
      })
      .sort((a, b) => b.size - a.size);
    
    console.log(`\n${colors.yellow}Server-side chunks (Top 5):${colors.reset}`);
    jsFiles.slice(0, 5).forEach((file, index) => {
      const sizeColor = file.size > 100000 ? colors.red : file.size > 50000 ? colors.yellow : colors.green;
      console.log(`  ${index + 1}. ${file.name} - ${sizeColor}${formatBytes(file.size)}${colors.reset}`);
    });
  }
}

function analyzeClientChunks(clientDir) {
  console.log(`${colors.bold}${colors.blue}🌐 Client Chunks Analysis${colors.reset}`);
  
  const files = fs.readdirSync(clientDir);
  const chunks = files
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const fullPath = path.join(clientDir, file);
      const stat = fs.statSync(fullPath);
      return { name: file, size: stat.size };
    })
    .sort((a, b) => b.size - a.size);
  
  console.log(`\n${colors.yellow}Client-side chunks (Top 10):${colors.reset}`);
  chunks.slice(0, 10).forEach((file, index) => {
    const sizeColor = file.size > 200000 ? colors.red : file.size > 100000 ? colors.yellow : colors.green;
    console.log(`  ${index + 1}. ${file.name} - ${sizeColor}${formatBytes(file.size)}${colors.reset}`);
  });
}

function generateOptimizationRecommendations() {
  console.log(`\n${colors.bold}${colors.magenta}🚀 Optimization Recommendations${colors.reset}`);
  
  console.log(`\n${colors.yellow}Potential Issues to Investigate:${colors.reset}`);
  console.log(`  1. ${colors.red}Large chunks > 200KB${colors.reset} - Consider code splitting`);
  console.log(`  2. ${colors.yellow}Duplicate dependencies${colors.reset} - Check for multiple versions`);
  console.log(`  3. ${colors.yellow}Unused dependencies${colors.reset} - Remove react-fast-marquee if not used`);
  console.log(`  4. ${colors.green}Tree shaking${colors.reset} - Ensure proper import patterns`);
  
  console.log(`\n${colors.yellow}Next Steps for Perfect Refactor:${colors.reset}`);
  console.log(`  1. Remove unused dependencies (react-fast-marquee, etc.)`);
  console.log(`  2. Optimize import patterns in hero components`);
  console.log(`  3. Enable modular imports for large libraries`);
  console.log(`  4. Review CSS bundle for redundancy`);
  
  console.log(`\n${colors.green}✅ Analysis complete! Check bundle analyzer at localhost:3000/__nextjs_build-analysis/${colors.reset}`);
}

// Main execution
if (require.main === module) {
  analyzeBundleStructure();
}

module.exports = { analyzeBundleStructure };