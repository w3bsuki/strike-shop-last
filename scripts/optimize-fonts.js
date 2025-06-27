#!/usr/bin/env node

/**
 * Font Optimization Script for Strike Shop
 * Converts TTF fonts to WOFF2, implements subsetting, and optimizes loading
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const FONT_DIR = path.join(__dirname, '..', 'public', 'fonts');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fonts', 'optimized');
const CSS_OUTPUT = path.join(__dirname, '..', 'styles', 'optimized-fonts.css');

// Characters to subset - includes all common Latin characters, numbers, and punctuation
const SUBSET_UNICODE_RANGE = 'U+0020-007F,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-205E';

// Font configurations
const FONTS = [
  {
    name: 'CourierPrime-Regular',
    weight: 'normal',
    style: 'normal',
    originalFile: 'CourierPrime-Regular.ttf'
  },
  {
    name: 'CourierPrime-Bold',
    weight: 'bold',
    style: 'normal',
    originalFile: 'CourierPrime-Bold.ttf'
  }
];

// Helper function to check if a command exists
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Helper function to install dependencies
async function installDependencies() {
  console.log('📦 Checking dependencies...');
  
  // Check for required tools
  const requiredTools = {
    'fonttools': 'pip install fonttools brotli',
    'woff2_compress': 'brew install woff2 || sudo apt-get install woff2',
    'glyphhanger': 'npm install -g glyphhanger'
  };
  
  const missingTools = [];
  
  // Check Python fonttools
  try {
    execSync('python3 -m fonttools --help', { stdio: 'ignore' });
  } catch {
    missingTools.push('fonttools');
  }
  
  // Check woff2_compress
  if (!commandExists('woff2_compress')) {
    missingTools.push('woff2_compress');
  }
  
  if (missingTools.length > 0) {
    console.log('⚠️  Missing tools detected. Please install:');
    missingTools.forEach(tool => {
      console.log(`   - ${tool}: ${requiredTools[tool]}`);
    });
    console.log('\nAlternatively, we\'ll use fallback methods.');
  }
  
  return missingTools.length === 0;
}

// Convert TTF to WOFF2 using Python fonttools
async function convertToWOFF2(inputPath, outputPath) {
  try {
    // Try native woff2_compress first
    if (commandExists('woff2_compress')) {
      execSync(`woff2_compress ${inputPath} ${outputPath}`, { stdio: 'inherit' });
      return true;
    }
    
    // Fallback to Python fonttools
    const pythonScript = `
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress

font = TTFont(sys.argv[1])
font.flavor = 'woff2'
font.save(sys.argv[2])
`;
    
    const scriptPath = path.join(__dirname, 'temp_convert.py');
    await fs.writeFile(scriptPath, pythonScript);
    
    try {
      execSync(`python3 ${scriptPath} "${inputPath}" "${outputPath}"`, { stdio: 'inherit' });
      await fs.unlink(scriptPath);
      return true;
    } catch (error) {
      await fs.unlink(scriptPath);
      throw error;
    }
  } catch (error) {
    console.error(`Failed to convert ${inputPath} to WOFF2:`, error.message);
    return false;
  }
}

// Subset font to include only used characters
async function subsetFont(inputPath, outputPath, unicodeRange) {
  try {
    const pythonScript = `
import sys
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

# Load the font
font = TTFont(sys.argv[1])

# Configure subsetter
options = Options()
options.flavor = 'woff2'
options.with_zopfli = True
options.desubroutinize = True

# Create subsetter with unicode range
subsetter = Subsetter(options=options)

# Parse unicode range
unicode_chars = []
ranges = sys.argv[3].split(',')
for range_str in ranges:
    if range_str.startswith('U+'):
        range_str = range_str[2:]
        if '-' in range_str:
            start, end = range_str.split('-')
            for i in range(int(start, 16), int(end, 16) + 1):
                unicode_chars.append(i)
        else:
            unicode_chars.append(int(range_str, 16))

# Populate subsetter
subsetter.populate(unicodes=unicode_chars)

# Subset the font
subsetter.subset(font)

# Save the subsetted font
font.save(sys.argv[2])
`;
    
    const scriptPath = path.join(__dirname, 'temp_subset.py');
    await fs.writeFile(scriptPath, pythonScript);
    
    try {
      execSync(`python3 ${scriptPath} "${inputPath}" "${outputPath}" "${unicodeRange}"`, { stdio: 'inherit' });
      await fs.unlink(scriptPath);
      return true;
    } catch (error) {
      await fs.unlink(scriptPath);
      throw error;
    }
  } catch (error) {
    console.error(`Failed to subset ${inputPath}:`, error.message);
    return false;
  }
}

// Generate hash for cache busting
function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Generate optimized CSS with preload hints
async function generateOptimizedCSS(fontData) {
  const cssContent = `/* ==========================================================================
   Optimized Fonts for Strike Shop
   Generated: ${new Date().toISOString()}
   ========================================================================== */

/* Preload hints for critical fonts */
${fontData.map(font => `/* @preload: /fonts/optimized/${font.filename} */`).join('\n')}

/* Font Face Declarations with WOFF2 and TTF fallback */
${fontData.map(font => `
@font-face {
  font-family: 'Typewriter';
  src: url('/fonts/optimized/${font.filename}') format('woff2'),
       url('/fonts/${font.originalFile}') format('truetype');
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;
  unicode-range: ${SUBSET_UNICODE_RANGE};
}
`).join('\n')}

/* System font fallback stack */
.font-typewriter {
  font-family: 'Typewriter', 'Courier Prime', 'Courier New', ui-monospace, 
               SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', 
               Menlo, monospace;
}

/* Font loading optimization classes */
.fonts-loading body {
  font-family: 'Courier New', ui-monospace, monospace;
}

.fonts-loaded body {
  font-family: 'Typewriter', 'Courier Prime', ui-monospace, monospace;
}

/* Critical text anti-FOIT (Flash of Invisible Text) */
.critical-text {
  font-display: block;
}

/* Performance hints */
@media (prefers-reduced-data: reduce) {
  @font-face {
    font-family: 'Typewriter';
    src: local('Courier New'), local('Courier');
    font-weight: normal;
    font-style: normal;
  }
  
  @font-face {
    font-family: 'Typewriter';
    src: local('Courier New'), local('Courier');
    font-weight: bold;
    font-style: normal;
  }
}
`;

  await fs.writeFile(CSS_OUTPUT, cssContent);
  console.log(`✅ Generated optimized CSS at ${CSS_OUTPUT}`);
}

// Generate font preload component
async function generatePreloadComponent(fontData) {
  const componentContent = `// Font Preload Component for Strike Shop
// Auto-generated - DO NOT EDIT

export function FontPreload() {
  return (
    <>
      ${fontData.map(font => `
      <link
        rel="preload"
        href="/fonts/optimized/${font.filename}"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />`).join('')}
    </>
  );
}
`;

  const componentPath = path.join(__dirname, '..', 'components', 'seo', 'font-preload.tsx');
  await fs.mkdir(path.dirname(componentPath), { recursive: true });
  await fs.writeFile(componentPath, componentContent);
  console.log(`✅ Generated font preload component`);
}

// Main optimization function
async function optimizeFonts() {
  console.log('🚀 Starting font optimization for Strike Shop...\n');
  
  // Check dependencies
  const hasAllDeps = await installDependencies();
  
  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const results = [];
  const fontData = [];
  
  for (const font of FONTS) {
    console.log(`\n📝 Processing ${font.name}...`);
    
    const inputPath = path.join(FONT_DIR, font.originalFile);
    const tempWoff2Path = path.join(OUTPUT_DIR, `${font.name}-temp.woff2`);
    const finalWoff2Path = path.join(OUTPUT_DIR, `${font.name}.woff2`);
    
    try {
      // Check if input file exists
      const inputStats = await fs.stat(inputPath);
      const originalSize = inputStats.size;
      
      console.log(`  Original size: ${(originalSize / 1024).toFixed(2)} KB`);
      
      // Convert to WOFF2
      console.log(`  Converting to WOFF2...`);
      const convertSuccess = await convertToWOFF2(inputPath, tempWoff2Path);
      
      if (convertSuccess) {
        // Subset the font
        console.log(`  Subsetting font...`);
        const subsetSuccess = await subsetFont(tempWoff2Path, finalWoff2Path, SUBSET_UNICODE_RANGE);
        
        if (subsetSuccess) {
          // Clean up temp file
          await fs.unlink(tempWoff2Path);
          
          // Get final size
          const finalStats = await fs.stat(finalWoff2Path);
          const finalSize = finalStats.size;
          const reduction = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
          
          console.log(`  ✅ Optimized size: ${(finalSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
          
          // Generate hash for cache busting
          const content = await fs.readFile(finalWoff2Path);
          const hash = generateHash(content);
          const hashedFilename = `${font.name}.${hash}.woff2`;
          const hashedPath = path.join(OUTPUT_DIR, hashedFilename);
          
          // Rename with hash
          await fs.rename(finalWoff2Path, hashedPath);
          
          fontData.push({
            ...font,
            filename: hashedFilename,
            originalSize,
            optimizedSize: finalSize,
            reduction
          });
          
          results.push({
            font: font.name,
            status: 'success',
            originalSize,
            optimizedSize: finalSize,
            reduction: `${reduction}%`
          });
        } else {
          throw new Error('Subsetting failed');
        }
      } else {
        throw new Error('WOFF2 conversion failed');
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.push({
        font: font.name,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Generate optimized CSS
  if (fontData.length > 0) {
    await generateOptimizedCSS(fontData);
    await generatePreloadComponent(fontData);
  }
  
  // Generate report
  await generateReport(results);
  
  console.log('\n✨ Font optimization complete!\n');
  
  return results;
}

// Generate optimization report
async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    results,
    totalOriginalSize: results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + r.originalSize, 0),
    totalOptimizedSize: results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + r.optimizedSize, 0),
    recommendations: [
      'Import the generated CSS file in your globals.css',
      'Add the FontPreload component to your layout',
      'Consider using variable fonts for even better performance',
      'Implement font loading API for better control'
    ]
  };
  
  const reportPath = path.join(__dirname, '..', 'font-optimization-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Optimization Summary:');
  console.log(`  Total original size: ${(report.totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`  Total optimized size: ${(report.totalOptimizedSize / 1024).toFixed(2)} KB`);
  console.log(`  Total reduction: ${((report.totalOriginalSize - report.totalOptimizedSize) / report.totalOriginalSize * 100).toFixed(1)}%`);
  console.log(`\n  Report saved to: ${reportPath}`);
}

// Run the optimization
if (require.main === module) {
  optimizeFonts().catch(console.error);
}

module.exports = { optimizeFonts };