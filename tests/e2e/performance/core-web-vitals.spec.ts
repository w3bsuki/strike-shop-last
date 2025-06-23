/**
 * Core Web Vitals Performance Tests
 * Tests key performance metrics that impact user experience and SEO
 * Measures LCP, FID, CLS, TTFB, and other critical metrics
 */

import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals @performance', () => {
  test('homepage meets Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to homepage and measure performance
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry: any) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              vitals.cls = (vitals.cls || 0) + entry.value;
            }
          });
          
          // Get navigation timing
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          vitals.ttfb = navigation.responseStart - navigation.requestStart;
          vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          vitals.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
          
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // Core Web Vitals thresholds
    if ('lcp' in metrics) {
      expect(metrics.lcp).toBeLessThan(2500); // LCP should be < 2.5s (good)
    }
    
    if ('fid' in metrics) {
      expect(metrics.fid).toBeLessThan(100); // FID should be < 100ms (good)
    }
    
    if ('cls' in metrics) {
      expect(metrics.cls).toBeLessThan(0.1); // CLS should be < 0.1 (good)
    }
    
    if ('ttfb' in metrics) {
      expect(metrics.ttfb).toBeLessThan(800); // TTFB should be < 800ms (good)
    }
  });

  test('product listing page performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/products', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Page should load within 3 seconds
    
    // Verify critical elements are visible quickly
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Test scroll performance
    const scrollStartTime = Date.now();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const scrollTime = Date.now() - scrollStartTime;
    expect(scrollTime).toBeLessThan(100); // Smooth scrolling
  });

  test('product detail page performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/products/test-smartphone', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2500);
    
    // Verify hero image loads quickly
    const heroImage = page.locator('[data-testid="product-image"]').first();
    await expect(heroImage).toBeVisible();
    
    // Test image switching performance
    const imageButtons = page.locator('[data-testid="image-thumbnail"]');
    if (await imageButtons.count() > 1) {
      const switchStartTime = Date.now();
      await imageButtons.nth(1).click();
      await page.waitForTimeout(100); // Allow image to load
      const switchTime = Date.now() - switchStartTime;
      expect(switchTime).toBeLessThan(500); // Image switch should be fast
    }
  });

  test('checkout page performance', async ({ page }) => {
    // Setup cart first
    await page.goto('/products/test-smartphone');
    await page.click('[data-testid="add-to-cart"]');
    
    const startTime = Date.now();
    await page.goto('/checkout', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
    
    // Verify form renders quickly
    await expect(page.locator('[data-testid="shipping-form"]')).toBeVisible();
    
    // Test form interaction performance
    const inputStartTime = Date.now();
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    const inputTime = Date.now() - inputStartTime;
    expect(inputTime).toBeLessThan(50); // Input should be responsive
  });

  test('search performance', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Test search input responsiveness
    const searchStartTime = Date.now();
    await searchInput.fill('smartphone');
    const searchTime = Date.now() - searchStartTime;
    expect(searchTime).toBeLessThan(100);
    
    // Test search results loading
    const resultsStartTime = Date.now();
    await searchInput.press('Enter');
    await page.waitForURL('**/products?search=*');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    const resultsTime = Date.now() - resultsStartTime;
    expect(resultsTime).toBeLessThan(2000);
  });
});

test.describe('Performance Metrics @performance', () => {
  test('measures and validates resource loading', async ({ page }) => {
    await page.goto('/');
    
    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const metrics = {
        totalResources: resources.length,
        imageCount: 0,
        scriptCount: 0,
        stylesheetCount: 0,
        largestResource: 0,
        slowestResource: 0,
        totalTransferSize: 0,
      };
      
      resources.forEach((resource) => {
        const duration = resource.responseEnd - resource.startTime;
        const size = resource.transferSize || 0;
        
        metrics.totalTransferSize += size;
        
        if (duration > metrics.slowestResource) {
          metrics.slowestResource = duration;
        }
        
        if (size > metrics.largestResource) {
          metrics.largestResource = size;
        }
        
        if (resource.name.includes('.js')) {
          metrics.scriptCount++;
        } else if (resource.name.includes('.css')) {
          metrics.stylesheetCount++;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
          metrics.imageCount++;
        }
      });
      
      return metrics;
    });
    
    // Validate resource loading performance
    expect(resourceMetrics.slowestResource).toBeLessThan(3000); // No resource should take > 3s
    expect(resourceMetrics.largestResource).toBeLessThan(2000000); // No resource > 2MB
    expect(resourceMetrics.totalTransferSize).toBeLessThan(5000000); // Total page size < 5MB
    
    console.log('Resource Metrics:', resourceMetrics);
  });

  test('validates JavaScript bundle size and performance', async ({ page }) => {
    await page.goto('/');
    
    const jsMetrics = await page.evaluate(() => {
      const scripts = performance.getEntriesByType('resource')
        .filter((resource: any) => resource.name.includes('.js')) as PerformanceResourceTiming[];
      
      let totalJSSize = 0;
      let largestBundle = 0;
      
      scripts.forEach((script) => {
        const size = script.transferSize || 0;
        totalJSSize += size;
        if (size > largestBundle) {
          largestBundle = size;
        }
      });
      
      return {
        bundleCount: scripts.length,
        totalSize: totalJSSize,
        largestBundle,
        averageSize: totalJSSize / scripts.length,
      };
    });
    
    // Validate JavaScript performance
    expect(jsMetrics.totalSize).toBeLessThan(1000000); // Total JS < 1MB
    expect(jsMetrics.largestBundle).toBeLessThan(500000); // Largest bundle < 500KB
    expect(jsMetrics.bundleCount).toBeLessThan(10); // Reasonable number of bundles
    
    console.log('JavaScript Metrics:', jsMetrics);
  });

  test('validates image optimization', async ({ page }) => {
    await page.goto('/products');
    
    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.images);
      
      const metrics = {
        totalImages: images.length,
        optimizedFormats: 0,
        lazyLoadedImages: 0,
        averageSize: 0,
        largestImage: 0,
      };
      
      images.forEach((img) => {
        // Check for modern image formats
        if (img.src.includes('.webp') || img.src.includes('.avif')) {
          metrics.optimizedFormats++;
        }
        
        // Check for lazy loading
        if (img.loading === 'lazy' || img.getAttribute('data-src')) {
          metrics.lazyLoadedImages++;
        }
      });
      
      return metrics;
    });
    
    // Validate image optimization
    const optimizationRate = imageMetrics.optimizedFormats / imageMetrics.totalImages;
    expect(optimizationRate).toBeGreaterThan(0.5); // At least 50% should use modern formats
    
    const lazyLoadRate = imageMetrics.lazyLoadedImages / imageMetrics.totalImages;
    expect(lazyLoadRate).toBeGreaterThan(0.7); // At least 70% should be lazy loaded
    
    console.log('Image Metrics:', imageMetrics);
  });

  test('measures runtime performance during interactions', async ({ page }) => {
    await page.goto('/products');
    
    // Measure filter interaction performance
    const filterStartTime = Date.now();
    await page.click('[data-testid="price-filter"]');
    await page.fill('[data-testid="price-min"]', '100');
    await page.fill('[data-testid="price-max"]', '500');
    await page.click('[data-testid="apply-filter"]');
    
    await page.waitForLoadState('networkidle');
    const filterTime = Date.now() - filterStartTime;
    expect(filterTime).toBeLessThan(1500); // Filter should apply quickly
    
    // Measure sort interaction performance
    const sortStartTime = Date.now();
    await page.selectOption('[data-testid="sort-dropdown"]', 'price-asc');
    await page.waitForLoadState('networkidle');
    const sortTime = Date.now() - sortStartTime;
    expect(sortTime).toBeLessThan(1000); // Sort should be fast
  });
});

test.describe('Mobile Performance @performance', () => {
  test('mobile performance meets standards', async ({ page }) => {
    // Simulate mobile device
    await page.emulate({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    
    // Simulate slow 3G connection
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 kbps
      latency: 300, // 300ms RTT
    });
    
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Mobile on slow connection should still load reasonably fast
    expect(loadTime).toBeLessThan(5000);
    
    // Critical content should be visible quickly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="navigation-menu"]')).toBeVisible();
  });

  test('mobile interactions are responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test touch interactions
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    
    if (await mobileMenuToggle.isVisible()) {
      const tapStartTime = Date.now();
      await mobileMenuToggle.tap();
      
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      const tapResponseTime = Date.now() - tapStartTime;
      expect(tapResponseTime).toBeLessThan(200); // Touch response should be immediate
    }
    
    // Test scroll performance on mobile
    const scrollStartTime = Date.now();
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollTime = Date.now() - scrollStartTime;
    expect(scrollTime).toBeLessThan(50); // Scroll should be smooth
  });
});

test.describe('Load Testing @performance', () => {
  test('handles concurrent user simulation', async ({ browser }) => {
    const concurrentUsers = 5;
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      const promise = (async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const startTime = Date.now();
        await page.goto('/');
        await page.goto('/products');
        await page.click('[data-testid="product-card"]');
        const endTime = Date.now();
        
        await context.close();
        return endTime - startTime;
      })();
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
    
    // Even with concurrent users, performance should remain reasonable
    expect(averageTime).toBeLessThan(5000);
    
    console.log(`Concurrent users test - Average time: ${averageTime}ms`);
  });

  test('memory usage stays within bounds', async ({ page }) => {
    await page.goto('/');
    
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate through multiple pages to test memory leaks
    const pages = ['/products', '/products/test-smartphone', '/cart', '/'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
      
      // Memory usage shouldn't increase dramatically
      expect(memoryIncreasePercent).toBeLessThan(200); // Less than 200% increase
      
      console.log(`Memory usage - Initial: ${initialMemory}, Final: ${finalMemory}, Increase: ${memoryIncreasePercent.toFixed(2)}%`);
    }
  });
});