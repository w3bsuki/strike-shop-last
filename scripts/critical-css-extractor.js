const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');
const postcss = require('postcss');
const cssnano = require('cssnano');

/**
 * Extract and optimize critical CSS for above-the-fold content
 * This script runs during build to inline critical styles
 */

const CRITICAL_SELECTORS = [
  // Layout essentials
  'html', 'body', 'main', 'header', 'nav',
  '#__next',
  
  // Typography
  '.font-typewriter',
  'h1', 'h2', 'h3', 'p', 'a',
  
  // Critical components
  '.hero-banner',
  '.product-grid',
  '.product-card',
  '.category-scroll',
  
  // Utilities
  '.container',
  '.flex', '.grid', '.block', '.inline-block',
  '.relative', '.absolute', '.fixed',
  '.w-full', '.h-full',
  '.text-center', '.text-left', '.text-right',
  
  // Loading states
  '.skeleton', '.skeleton-shimmer',
  '.animate-pulse',
  
  // Above the fold specific
  '[class*="mt-"]', '[class*="mb-"]', '[class*="pt-"]', '[class*="pb-"]',
  '[class*="text-"]', '[class*="bg-"]',
];

async function extractCriticalCSS() {
  try {
    console.log('🎨 Extracting critical CSS...');
    
    // Read the main CSS file
    const cssPath = path.join(process.cwd(), '.next/static/css');
    const cssFiles = fs.readdirSync(cssPath).filter(f => f.endsWith('.css'));
    
    if (cssFiles.length === 0) {
      console.error('No CSS files found. Run build first.');
      return;
    }
    
    let criticalCSS = '';
    
    for (const file of cssFiles) {
      const cssContent = fs.readFileSync(path.join(cssPath, file), 'utf8');
      
      // Extract critical CSS using regex for performance
      const criticalRules = [];
      const cssRules = cssContent.match(/[^}]+{[^}]+}/g) || [];
      
      cssRules.forEach(rule => {
        const selector = rule.match(/^[^{]+/)?.[0]?.trim();
        if (selector && CRITICAL_SELECTORS.some(critical => 
          selector.includes(critical) || selector.startsWith(critical)
        )) {
          criticalRules.push(rule);
        }
      });
      
      criticalCSS += criticalRules.join('\n');
    }
    
    // Optimize the critical CSS
    const result = await postcss([
      cssnano({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifySelectors: true,
        }]
      })
    ]).process(criticalCSS, { from: undefined });
    
    // Create critical CSS file
    const outputPath = path.join(process.cwd(), 'public/critical.css');
    fs.writeFileSync(outputPath, result.css);
    
    // Also create an inline version for the HTML
    const inlineVersion = `<style id="critical-css">${result.css}</style>`;
    fs.writeFileSync(
      path.join(process.cwd(), 'public/critical-inline.html'),
      inlineVersion
    );
    
    console.log(`✅ Critical CSS extracted (${(result.css.length / 1024).toFixed(2)}KB)`);
    console.log(`📍 Saved to: ${outputPath}`);
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      originalSize: criticalCSS.length,
      optimizedSize: result.css.length,
      reduction: ((1 - result.css.length / criticalCSS.length) * 100).toFixed(2) + '%',
      selectorsIncluded: CRITICAL_SELECTORS.length,
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'critical-css-report.json'),
      JSON.stringify(report, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  extractCriticalCSS();
}

module.exports = { extractCriticalCSS };