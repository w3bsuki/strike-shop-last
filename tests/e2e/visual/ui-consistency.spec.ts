/**
 * Visual Regression Tests
 * Tests UI consistency and prevents visual regressions
 * Captures screenshots and compares them against baselines
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests @visual', () => {
  test('homepage visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content that changes between runs
    await page.addStyleTag({
      content: `
        [data-testid="current-time"],
        [data-testid="user-specific-content"] {
          visibility: hidden !important;
        }
      `
    });
    
    // Wait for images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every(img => img.complete);
    });
    
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('product listing visual consistency', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Ensure consistent product grid layout
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="real-time-stock"],
        [data-testid="personalized-recommendations"] {
          visibility: hidden !important;
        }
        /* Ensure consistent spacing */
        [data-testid="product-card"] {
          animation: none !important;
          transition: none !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('product-listing.png');
  });

  test('product detail visual consistency', async ({ page }) => {
    await page.goto('/products/test-smartphone');
    await page.waitForLoadState('networkidle');
    
    // Wait for product images to load
    await page.waitForSelector('[data-testid="product-image"]');
    await page.waitForFunction(() => {
      const productImages = Array.from(document.querySelectorAll('[data-testid="product-image"] img'));
      return productImages.every((img: any) => img.complete);
    });
    
    // Hide dynamic content
    await page.addStyleTag({
      content: `
        [data-testid="current-price-change"],
        [data-testid="stock-countdown"],
        [data-testid="recently-viewed"] {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('product-detail.png');
  });

  test('shopping cart visual consistency', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products/test-smartphone');
    await page.click('[data-testid="add-to-cart"]');
    
    // Open cart
    await page.click('[data-testid="cart-icon"]');
    await page.waitForSelector('[data-testid="cart-sidebar"]');
    
    // Hide dynamic timestamps and animations
    await page.addStyleTag({
      content: `
        [data-testid="cart-sidebar"] * {
          animation: none !important;
          transition: none !important;
        }
        [data-testid="time-added"],
        [data-testid="shipping-estimate"] {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(page.locator('[data-testid="cart-sidebar"]')).toHaveScreenshot('shopping-cart.png');
  });

  test('checkout form visual consistency', async ({ page }) => {
    // Setup cart and navigate to checkout
    await page.goto('/products/test-smartphone');
    await page.click('[data-testid="add-to-cart"]');
    await page.goto('/checkout');
    
    await page.waitForSelector('[data-testid="checkout-form"]');
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        * {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('checkout-form.png');
  });

  test('navigation menu visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Open navigation menu
    const navToggle = page.locator('[data-testid="navigation-toggle"]');
    if (await navToggle.isVisible()) {
      await navToggle.click();
    }
    
    await page.waitForSelector('[data-testid="navigation-menu"]');
    
    // Disable hover effects and animations
    await page.addStyleTag({
      content: `
        [data-testid="navigation-menu"] * {
          animation: none !important;
          transition: none !important;
        }
        [data-testid="navigation-menu"] *:hover {
          transform: none !important;
        }
      `
    });
    
    await expect(page.locator('[data-testid="navigation-menu"]')).toHaveScreenshot('navigation-menu.png');
  });

  test('user authentication forms visual consistency', async ({ page }) => {
    // Test sign-in form
    await page.goto('/sign-in');
    await page.waitForSelector('[data-testid="signin-form"]');
    
    await page.addStyleTag({
      content: `
        * {
          animation: none !important;
          transition: none !important;
        }
      `
    });
    
    await expect(page.locator('[data-testid="signin-form"]')).toHaveScreenshot('signin-form.png');
    
    // Test sign-up form
    await page.goto('/sign-up');
    await page.waitForSelector('[data-testid="signup-form"]');
    
    await expect(page.locator('[data-testid="signup-form"]')).toHaveScreenshot('signup-form.png');
  });

  test('error states visual consistency', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('404-page.png');
    
    // Test form validation errors
    await page.goto('/sign-up');
    await page.click('[data-testid="signup-button"]');
    
    // Wait for validation errors to appear
    await page.waitForSelector('[data-testid="validation-error"]');
    
    await expect(page.locator('[data-testid="signup-form"]')).toHaveScreenshot('form-validation-errors.png');
  });

  test('search results visual consistency', async ({ page }) => {
    await page.goto('/');
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'smartphone');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="search-time"],
        [data-testid="personalized-results"] {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('search-results.png');
  });

  test('responsive breakpoints visual consistency', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 },
      { name: 'large-desktop', width: 1920, height: 1080 },
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Hide viewport-specific dynamic content
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="user-location"] {
            visibility: hidden !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot(`homepage-${breakpoint.name}.png`);
    }
  });
});

test.describe('Component Visual Tests @visual', () => {
  test('product card component variations', async ({ page }) => {
    await page.goto('/products');
    
    // Test individual product card
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.waitFor({ state: 'visible' });
    
    await page.addStyleTag({
      content: `
        [data-testid="product-card"] {
          animation: none !important;
          transition: none !important;
        }
      `
    });
    
    await expect(productCard).toHaveScreenshot('product-card-default.png');
    
    // Test hover state
    await productCard.hover();
    await expect(productCard).toHaveScreenshot('product-card-hover.png');
    
    // Test out-of-stock state (if available)
    const outOfStockCard = page.locator('[data-testid="product-card"][data-stock="0"]');
    if (await outOfStockCard.count() > 0) {
      await expect(outOfStockCard.first()).toHaveScreenshot('product-card-out-of-stock.png');
    }
  });

  test('button component variations', async ({ page }) => {
    await page.goto('/products/test-smartphone');
    
    // Test primary button
    const primaryButton = page.locator('[data-testid="add-to-cart"]');
    await expect(primaryButton).toHaveScreenshot('button-primary.png');
    
    // Test secondary button
    const secondaryButton = page.locator('[data-testid="add-to-wishlist"]');
    if (await secondaryButton.isVisible()) {
      await expect(secondaryButton).toHaveScreenshot('button-secondary.png');
    }
    
    // Test disabled state
    await page.addStyleTag({
      content: `
        [data-testid="add-to-cart"] {
          pointer-events: none;
          opacity: 0.5;
        }
      `
    });
    
    await expect(primaryButton).toHaveScreenshot('button-disabled.png');
  });

  test('form input component variations', async ({ page }) => {
    await page.goto('/sign-up');
    
    const emailInput = page.locator('[data-testid="email-input"]');
    
    // Test empty state
    await expect(emailInput).toHaveScreenshot('input-empty.png');
    
    // Test filled state
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveScreenshot('input-filled.png');
    
    // Test error state
    await emailInput.fill('invalid-email');
    await page.click('[data-testid="first-name-input"]'); // Trigger validation
    await expect(emailInput).toHaveScreenshot('input-error.png');
    
    // Test focused state
    await emailInput.focus();
    await expect(emailInput).toHaveScreenshot('input-focused.png');
  });

  test('modal dialog variations', async ({ page }) => {
    await page.goto('/products/test-smartphone');
    
    // Open product modal (if available)
    const modalTrigger = page.locator('[data-testid="quick-view"]');
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      const modal = page.locator('[data-testid="product-modal"]');
      await modal.waitFor({ state: 'visible' });
      
      await page.addStyleTag({
        content: `
          [data-testid="product-modal"] {
            animation: none !important;
            transition: none !important;
          }
        `
      });
      
      await expect(modal).toHaveScreenshot('modal-product-detail.png');
    }
  });

  test('loading states visual consistency', async ({ page }) => {
    // Test loading spinner
    await page.goto('/products');
    
    // Simulate slow loading
    await page.route('**/api/products**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.reload();
    
    // Capture loading state
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toHaveScreenshot('loading-spinner.png');
    }
    
    // Test skeleton loading
    const skeletonLoader = page.locator('[data-testid="skeleton-loader"]');
    if (await skeletonLoader.isVisible()) {
      await expect(skeletonLoader).toHaveScreenshot('skeleton-loader.png');
    }
  });
});

test.describe('Dark Mode Visual Tests @visual', () => {
  test('dark mode visual consistency', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    const pages = [
      { url: '/', name: 'homepage' },
      { url: '/products', name: 'products' },
      { url: '/sign-in', name: 'signin' },
    ];

    for (const testPage of pages) {
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');
      
      // Hide dynamic content
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="user-specific-content"] {
            visibility: hidden !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot(`${testPage.name}-dark-mode.png`);
    }
  });

  test('theme toggle functionality', async ({ page }) => {
    await page.goto('/');
    
    // Test light mode (default)
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await expect(page.locator('body')).toHaveScreenshot('theme-light.png');
      
      // Switch to dark mode
      await themeToggle.click();
      await page.waitForTimeout(500); // Allow theme transition
      
      await expect(page.locator('body')).toHaveScreenshot('theme-dark.png');
      
      // Switch back to light mode
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('body')).toHaveScreenshot('theme-light-restored.png');
    }
  });
});

test.describe('Cross-Browser Visual Tests @visual', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`homepage renders consistently in ${browserName}`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Hide dynamic content
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          [data-testid="user-specific-content"] {
            visibility: hidden !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot(`homepage-${browserName}.png`);
    });
  });
});