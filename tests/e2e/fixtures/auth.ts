/**
 * Authentication Fixtures for E2E Tests
 * Provides authenticated and guest user contexts
 */

import { test as base, Page } from '@playwright/test';

export interface AuthFixtures {
  authenticatedPage: Page;
  guestPage: Page;
  adminPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Sign in with test user
    await signInTestUser(page);
    
    await use(page);
    await context.close();
  },

  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Sign in with admin user
    await signInAdminUser(page);
    
    await use(page);
    await context.close();
  },
});

async function signInTestUser(page: Page) {
  await page.goto('/sign-in');
  
  // Fill in test user credentials
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'testpassword123');
  await page.click('[data-testid="sign-in-button"]');
  
  // Wait for successful sign in
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

async function signInAdminUser(page: Page) {
  await page.goto('/sign-in');
  
  // Fill in admin credentials
  await page.fill('[data-testid="email-input"]', 'admin@example.com');
  await page.fill('[data-testid="password-input"]', 'adminpassword123');
  await page.click('[data-testid="sign-in-button"]');
  
  // Wait for successful admin sign in
  await page.waitForURL('/admin', { timeout: 10000 });
}

export { expect } from '@playwright/test';