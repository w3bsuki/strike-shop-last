const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs').promises;
const path = require('path');

// WCAG 2.1 AA rules configuration
const wcagConfig = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
  },
  rules: {
    // Ensure all WCAG AA rules are enabled
    'color-contrast': { enabled: true },
    'focus-visible': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-viewport': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true },
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'valid-lang': { enabled: true },
    'aria-allowed-role': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'tabindex': { enabled: true },
    'duplicate-id': { enabled: true },
    'heading-order': { enabled: true },
    'empty-heading': { enabled: true },
    'p-as-heading': { enabled: true },
    'frame-title': { enabled: true },
    'frame-title-unique': { enabled: true },
    'input-image-alt': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'select-name': { enabled: true },
    'scrollable-region-focusable': { enabled: true },
    'th-has-data-cells': { enabled: true },
    'definition-list': { enabled: true },
    'dlitem': { enabled: true },
    'no-autoplay-audio': { enabled: true },
    'svg-img-alt': { enabled: true },
  }
};

// Pages to test
const pagesToTest = [
  { name: 'Homepage', url: '/' },
  { name: 'Category Page', url: '/categories/mens' },
  { name: 'Product Page', url: '/product/sample-product' },
  { name: 'Search Results', url: '/search?q=shirt' },
  { name: 'Cart Page', url: '/cart' },
  { name: 'Checkout Page', url: '/checkout' },
  { name: 'Account Page', url: '/account' },
  { name: 'Wishlist Page', url: '/wishlist' },
];

// Viewport sizes to test
const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

async function validateWCAG() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalViolations: 0,
      totalWarnings: 0,
      totalPasses: 0,
      criticalIssues: [],
    },
    pages: [],
  };

  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

  for (const pageInfo of pagesToTest) {
    console.log(`Testing ${pageInfo.name}...`);
    const pageResults = {
      name: pageInfo.name,
      url: pageInfo.url,
      viewports: [],
    };

    for (const viewport of viewports) {
      const page = await context.newPage();
      await page.setViewportSize(viewport);
      
      try {
        await page.goto(baseUrl + pageInfo.url, { waitUntil: 'networkidle' });
        
        // Run axe accessibility tests
        const accessibilityResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const viewportResult = {
          viewport: viewport.name,
          violations: accessibilityResults.violations.length,
          passes: accessibilityResults.passes.length,
          incomplete: accessibilityResults.incomplete.length,
          details: {
            violations: accessibilityResults.violations.map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              helpUrl: v.helpUrl,
              nodes: v.nodes.length,
              tags: v.tags,
            })),
            incomplete: accessibilityResults.incomplete.map(i => ({
              id: i.id,
              description: i.description,
              nodes: i.nodes.length,
            })),
          },
        };

        // Update summary
        results.summary.totalViolations += viewportResult.violations;
        results.summary.totalPasses += viewportResult.passes;

        // Track critical issues
        accessibilityResults.violations.forEach(v => {
          if (v.impact === 'critical' || v.impact === 'serious') {
            results.summary.criticalIssues.push({
              page: pageInfo.name,
              viewport: viewport.name,
              issue: v.id,
              impact: v.impact,
              description: v.description,
            });
          }
        });

        pageResults.viewports.push(viewportResult);
      } catch (error) {
        console.error(`Error testing ${pageInfo.name} on ${viewport.name}:`, error);
        pageResults.viewports.push({
          viewport: viewport.name,
          error: error.message,
        });
      } finally {
        await page.close();
      }
    }

    results.pages.push(pageResults);
  }

  await browser.close();

  // Save results
  const reportPath = path.join(process.cwd(), 'wcag-validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

  // Generate summary report
  console.log('\n=== WCAG 2.1 AA Validation Summary ===');
  console.log(`Total Violations: ${results.summary.totalViolations}`);
  console.log(`Total Passes: ${results.summary.totalPasses}`);
  console.log(`Critical Issues: ${results.summary.criticalIssues.length}`);
  
  if (results.summary.criticalIssues.length > 0) {
    console.log('\nCritical Issues Found:');
    results.summary.criticalIssues.forEach(issue => {
      console.log(`- ${issue.page} (${issue.viewport}): ${issue.description}`);
    });
  }

  // Return exit code based on violations
  return results.summary.totalViolations === 0 ? 0 : 1;
}

// Run validation
validateWCAG()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });