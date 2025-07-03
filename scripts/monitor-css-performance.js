const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function analyzeCSSPerformance() {
  console.log('📊 CSS Performance Analysis\n');
  
  // Find all CSS files
  const cssFiles = [];
  function findCSS(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findCSS(filePath);
      } else if (file.endsWith('.css')) {
        cssFiles.push(filePath);
      }
    });
  }
  
  findCSS('.');
  
  // Analyze each CSS file
  for (const file of cssFiles) {
    if (file.includes('node_modules') || file.includes('.next')) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    const stats = fs.statSync(file);
    
    console.log(`\nFile: ${file}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)}KB`);
    console.log(`Lines: ${content.split('\n').length}`);
    
    // Check for optimizations
    const hasLayers = content.includes('@layer');
    const hasImport = content.includes('@import');
    const hasVariables = content.includes('--');
    
    console.log(`Features: ${[
      hasLayers && 'CSS Layers',
      hasImport && 'Imports',
      hasVariables && 'CSS Variables'
    ].filter(Boolean).join(', ') || 'None'}`);
  }
  
  // Build CSS and check final size
  try {
    console.log('\n🏗️  Building production CSS...');
    await execAsync('NODE_ENV=production npm run build');
    
    // Find built CSS files
    const builtCSS = [];
    function findBuiltCSS(dir) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.css')) {
          builtCSS.push(path.join(dir, file));
        }
      });
    }
    
    findBuiltCSS('.next/static/css');
    
    if (builtCSS.length > 0) {
      console.log('\n📦 Production CSS Files:');
      let totalSize = 0;
      builtCSS.forEach(file => {
        const size = fs.statSync(file).size;
        totalSize += size;
        console.log(`- ${path.basename(file)}: ${(size / 1024).toFixed(2)}KB`);
      });
      console.log(`\nTotal CSS Size: ${(totalSize / 1024).toFixed(2)}KB`);
    }
  } catch (error) {
    console.log('⚠️  Could not analyze production build');
  }
}

analyzeCSSPerformance();
