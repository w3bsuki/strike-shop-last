/**
 * Global E2E Test Setup
 * Prepares the test environment before running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for application to be ready
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:4000';
    console.log(`📡 Checking application availability at ${baseURL}...`);
    
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Verify critical pages are accessible
    await page.goto(`${baseURL}/products`);
    await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 });
    
    // Set up test data if needed
    await setupTestData(page, baseURL);
    
    console.log('✅ E2E test setup completed successfully');
    
  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any, baseURL: string) {
  // Create test user session if needed
  // Set up test products, categories, etc.
  // This would interact with your test database or API
  
  console.log('📝 Setting up test data...');
  
  // Example: Navigate to admin and create test products
  // await page.goto(`${baseURL}/admin/products`);
  // await createTestProduct(page);
  
  console.log('✅ Test data setup completed');
}

export default globalSetup;