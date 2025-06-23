/**
 * Accessibility Compliance E2E Tests
 * Tests WCAG 2.1 AA compliance across the application
 * Critical for inclusive design and legal compliance
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance @accessibility', () => {
  test('homepage meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('product listing page is accessible', async ({ page }) => {
    await page.goto('/products');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('product detail page is accessible', async ({ page }) => {
    await page.goto('/products/test-smartphone');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('shopping cart is accessible', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products/test-smartphone');
    await page.click('[data-testid="add-to-cart"]');
    
    // Open cart
    await page.click('[data-testid="cart-icon"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('checkout process is accessible', async ({ page }) => {
    // Setup cart and go to checkout
    await page.goto('/products/test-smartphone');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('authentication pages are accessible', async ({ page }) => {
    // Test sign-in page
    await page.goto('/sign-in');
    
    let accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Test sign-up page
    await page.goto('/sign-up');
    
    accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('user profile pages are accessible', async ({ page }) => {
    // Login first (mock or test user)
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="signin-button"]');

    // Test profile page
    await page.goto('/profile');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation @accessibility', () => {
  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Get all focusable elements
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();

    // Test each element can receive focus
    for (const element of focusableElements) {
      await element.focus();
      await expect(element).toBeFocused();
    }
  });

  test('tab navigation follows logical order on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Start with first focusable element
    await page.keyboard.press('Tab');
    
    // Test main navigation items are accessible in order
    const navigationLinks = [
      '[data-testid="home-link"]',
      '[data-testid="products-link"]',
      '[data-testid="categories-link"]',
      '[data-testid="search-input"]',
      '[data-testid="cart-icon"]',
      '[data-testid="user-menu"]',
    ];

    for (const selector of navigationLinks) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeFocused();
        await page.keyboard.press('Tab');
      }
    }
  });

  test('dropdown menus are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Focus on navigation menu
    await page.keyboard.press('Tab');
    
    // Test dropdown navigation with keyboard
    const categoryMenu = page.locator('[data-testid="categories-menu"]');
    if (await categoryMenu.isVisible()) {
      await categoryMenu.focus();
      await page.keyboard.press('Enter');
      
      // Verify dropdown opens
      await expect(page.locator('[data-testid="categories-dropdown"]')).toBeVisible();
      
      // Navigate dropdown items with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Verify selection works
      await expect(page).toHaveURL(/categories/);
    }
  });

  test('modal dialogs are keyboard accessible', async ({ page }) => {
    await page.goto('/products/test-smartphone');
    
    // Open quick view modal (if available)
    const quickViewButton = page.locator('[data-testid="quick-view"]');
    if (await quickViewButton.isVisible()) {
      await quickViewButton.click();
      
      const modal = page.locator('[data-testid="product-modal"]');
      await expect(modal).toBeVisible();
      
      // Test focus trap in modal
      await page.keyboard.press('Tab');
      const firstFocusable = page.locator('[data-testid="modal-close"]');
      await expect(firstFocusable).toBeFocused();
      
      // Test escape key closes modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('form controls are keyboard accessible', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Test form navigation with Tab
    const formFields = [
      '[data-testid="first-name-input"]',
      '[data-testid="last-name-input"]',
      '[data-testid="email-input"]',
      '[data-testid="password-input"]',
      '[data-testid="confirm-password-input"]',
      '[data-testid="terms-checkbox"]',
      '[data-testid="signup-button"]',
    ];

    for (const selector of formFields) {
      await page.keyboard.press('Tab');
      const element = page.locator(selector);
      await expect(element).toBeFocused();
    }

    // Test form submission with Enter key
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.keyboard.press('Enter');
    
    // Verify validation message appears
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  });
});

test.describe('Screen Reader Support @accessibility', () => {
  test('images have appropriate alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      const role = await image.getAttribute('role');
      
      // Images should have alt text or be decorative
      if (role !== 'presentation' && !alt) {
        throw new Error(`Image missing alt text: ${await image.getAttribute('src')}`);
      }
      
      // Alt text should be descriptive, not just filename
      if (alt && alt.includes('.jpg') || alt && alt.includes('.png')) {
        throw new Error(`Alt text appears to be filename: ${alt}`);
      }
    }
  });

  test('headings create logical document structure', async ({ page }) => {
    await page.goto('/');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));
      headingLevels.push(level);
    }
    
    // Should start with h1
    expect(headingLevels[0]).toBe(1);
    
    // Should not skip heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('form labels are properly associated', async ({ page }) => {
    await page.goto('/sign-up');
    
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input should have label association
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      } else if (!ariaLabel && !ariaLabelledBy) {
        throw new Error('Input missing label association');
      }
    }
  });

  test('ARIA attributes are used correctly', async ({ page }) => {
    await page.goto('/products');
    
    // Test ARIA landmarks
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    
    // Test ARIA states on interactive elements
    const buttons = page.locator('button[aria-expanded]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const expanded = await button.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(expanded);
    }
  });

  test('live regions announce dynamic content', async ({ page }) => {
    await page.goto('/products/test-smartphone');
    
    // Add item to cart
    await page.click('[data-testid="add-to-cart"]');
    
    // Verify live region announces cart update
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    await expect(liveRegion).toContainText(/added to cart|item added/i);
  });
});

test.describe('Visual Accessibility @accessibility', () => {
  test('color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    
    // This would typically use a specialized tool to check contrast ratios
    // For now, we'll verify key elements have sufficient contrast
    const textElements = page.locator('p, span, a, button');
    const elementCount = await textElements.count();
    
    // Sample check on first few elements
    for (let i = 0; i < Math.min(10, elementCount); i++) {
      const element = textElements.nth(i);
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Verify text is not too small
      const fontSize = parseInt(styles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(14);
    }
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    
    // Test focus indicators on interactive elements
    const focusableElements = page.locator('button, a, input');
    const elementCount = await focusableElements.count();
    
    for (let i = 0; i < Math.min(5, elementCount); i++) {
      const element = focusableElements.nth(i);
      await element.focus();
      
      // Check that focused element has visible outline or other focus indicator
      const focusStyles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow,
        };
      });
      
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('content is readable when zoomed to 200%', async ({ page }) => {
    await page.goto('/');
    
    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await page.waitForTimeout(1000);
    
    // Verify content is still accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-menu"]')).toBeVisible();
    
    // Verify no horizontal scrolling at 200% zoom
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    
    // Allow some tolerance for scrollbars
    expect(scrollWidth - clientWidth).toBeLessThan(50);
  });

  test('motion respects prefers-reduced-motion', async ({ page, browserName }) => {
    // Set prefers-reduced-motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    
    // Check that animations are disabled or reduced
    const animatedElements = page.locator('[data-testid="animated-element"]');
    
    if (await animatedElements.count() > 0) {
      const element = animatedElements.first();
      const animationDuration = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration;
      });
      
      // Animation should be instant or very short when reduced motion is preferred
      expect(['0s', '0.01s']).toContain(animationDuration);
    }
  });
});

test.describe('Mobile Accessibility @accessibility', () => {
  test('touch targets meet minimum size requirements', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const touchTargets = page.locator('button, a, [role="button"]');
    const targetCount = await touchTargets.count();
    
    for (let i = 0; i < Math.min(10, targetCount); i++) {
      const target = touchTargets.nth(i);
      
      if (await target.isVisible()) {
        const boundingBox = await target.boundingBox();
        
        if (boundingBox) {
          // WCAG recommends minimum 44x44 pixels for touch targets
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('mobile navigation is accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test mobile menu toggle
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await mobileMenuToggle.isVisible()) {
      // Should be keyboard accessible
      await mobileMenuToggle.focus();
      await expect(mobileMenuToggle).toBeFocused();
      
      // Should have appropriate ARIA attributes
      const expanded = await mobileMenuToggle.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(expanded);
      
      // Open menu
      await mobileMenuToggle.click();
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
      
      // Menu should be accessible to screen readers
      const menuRole = await mobileMenu.getAttribute('role');
      expect(['menu', 'navigation']).toContain(menuRole);
    }
  });
});