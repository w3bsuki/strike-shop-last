/**
 * Product Discovery E2E Test
 * Tests how users find and explore products
 * Critical for conversion and user experience
 */

import { test, expect } from '../fixtures/auth';
import { HomePage } from '../page-objects/home.page';
import { ProductPage } from '../page-objects/product.page';
import { testProducts, testCategories } from '../fixtures/data';

test.describe('Product Discovery Journey', () => {
  test('user can browse products from homepage', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);

    // Step 1: Start on homepage
    await home.goto();
    await home.verifyPageLoad();
    await home.verifyFeaturedProducts();
    await home.verifyCategoryGrid();

    // Step 2: Click on featured product
    await home.clickFeaturedProduct(testProducts[0].title);
    await product.verifyProductDetails();

    // Step 3: Navigate back and try category
    await guestPage.goBack();
    await home.navigateToCategory('Electronics');
    await product.verifyProductGrid();
  });

  test('user can search for products effectively', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);

    // Step 1: Search from homepage
    await home.goto();
    await home.searchProduct('smartphone');
    await product.verifySearchResults('smartphone');

    // Step 2: Verify search results show relevant products
    await product.verifyProductGrid();
    const results = guestPage.locator('[data-testid="product-card"]');
    await expect(results.first()).toContainText(/smartphone|phone|mobile/i);

    // Step 3: Try different search terms
    await home.searchProduct('laptop');
    await product.verifySearchResults('laptop');
    await expect(results.first()).toContainText(/laptop|computer/i);

    // Step 4: Test search with no results
    await home.searchProduct('nonexistentproduct123');
    await expect(guestPage.locator('[data-testid="no-results"]')).toBeVisible();
  });

  test('user can filter and sort products', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Step 1: Go to products page
    await product.gotoProductListing();
    await product.verifyProductGrid();

    // Step 2: Apply price filter
    await product.filterByPrice(100, 500);
    await product.verifyProductGrid();
    
    // Verify all products are within price range
    const priceElements = guestPage.locator('[data-testid="product-price"]');
    const count = await priceElements.count();
    for (let i = 0; i < count; i++) {
      const priceText = await priceElements.nth(i).textContent();
      const price = parseFloat(priceText?.replace(/[$,]/g, '') || '0');
      expect(price).toBeGreaterThanOrEqual(100);
      expect(price).toBeLessThanOrEqual(500);
    }

    // Step 3: Apply category filter
    await product.filterByCategory('Electronics');
    await product.verifyProductGrid();

    // Step 4: Test sorting
    await product.sortProducts('price-asc');
    await product.verifyProductGrid();
    
    // Verify sorting order (prices should be ascending)
    const firstPrice = await guestPage.locator('[data-testid="product-price"]').first().textContent();
    const lastPrice = await guestPage.locator('[data-testid="product-price"]').last().textContent();
    const firstPriceNum = parseFloat(firstPrice?.replace(/[$,]/g, '') || '0');
    const lastPriceNum = parseFloat(lastPrice?.replace(/[$,]/g, '') || '0');
    expect(firstPriceNum).toBeLessThanOrEqual(lastPriceNum);
  });

  test('user can navigate product categories', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);

    // Step 1: Navigate to each category
    for (const category of testCategories) {
      await home.goto();
      await home.navigateToCategory(category.name);
      await product.verifyProductGrid();
      
      // Verify URL reflects category
      await expect(guestPage).toHaveURL(new RegExp(category.handle));
      
      // Verify page title reflects category
      await expect(guestPage.locator('h1')).toContainText(category.name);
    }
  });

  test('user can view detailed product information', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Step 1: Navigate to product detail
    await product.gotoProductDetail(testProducts[0].handle);
    await product.verifyProductDetails();

    // Step 2: Verify all product information is displayed
    await product.verifyProductImages();
    await product.verifyProductPrice('$699.99');
    await expect(product.productDescription).toContainText(testProducts[0].description);

    // Step 3: Test image navigation
    await product.navigateProductImages();

    // Step 4: Verify variant selection
    if (testProducts[0].variants.length > 1) {
      await product.selectVariant(testProducts[0].variants[1].id);
      await product.verifyProductPrice('$799.99');
    }

    // Step 5: Test quantity selector
    await product.setQuantity(3);
    await expect(product.quantitySelector).toHaveValue('3');
  });

  test('user can use wishlist functionality', async ({ authenticatedPage }) => {
    const product = new ProductPage(authenticatedPage);

    // Step 1: Add product to wishlist from grid
    await product.gotoProductListing();
    await product.addProductToWishlistFromGrid(testProducts[0].title);

    // Step 2: Verify wishlist notification
    await expect(authenticatedPage.locator('[data-testid="wishlist-notification"]')).toBeVisible();

    // Step 3: Add another product from detail page
    await product.gotoProductDetail(testProducts[1].handle);
    await product.addToWishlist();

    // Step 4: Navigate to wishlist and verify items
    await authenticatedPage.goto('/wishlist');
    const wishlistItems = authenticatedPage.locator('[data-testid="wishlist-item"]');
    await expect(wishlistItems).toHaveCount(2);
    
    // Step 5: Remove item from wishlist
    await wishlistItems.first().locator('[data-testid="remove-from-wishlist"]').click();
    await expect(wishlistItems).toHaveCount(1);
  });

  test('user can compare products', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Step 1: Add products to comparison
    await product.gotoProductListing();
    const productCards = guestPage.locator('[data-testid="product-card"]');
    
    await productCards.first().locator('[data-testid="add-to-compare"]').click();
    await productCards.nth(1).locator('[data-testid="add-to-compare"]').click();

    // Step 2: Navigate to comparison page
    await guestPage.click('[data-testid="compare-button"]');
    await expect(guestPage).toHaveURL(/compare/);

    // Step 3: Verify comparison table
    const comparisonTable = guestPage.locator('[data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();
    
    const comparedProducts = comparisonTable.locator('[data-testid="compared-product"]');
    await expect(comparedProducts).toHaveCount(2);

    // Step 4: Add to cart from comparison
    await comparedProducts.first().locator('[data-testid="add-to-cart"]').click();
    await expect(guestPage.locator('[data-testid="cart-notification"]')).toBeVisible();
  });

  test('product pages are accessible via direct URLs', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Test direct navigation to product URLs
    for (const testProduct of testProducts) {
      await product.gotoProductDetail(testProduct.handle);
      await product.verifyProductDetails();
      
      // Verify product title matches
      await expect(product.productTitle).toContainText(testProduct.title);
      
      // Verify SEO elements
      await expect(guestPage).toHaveTitle(new RegExp(testProduct.title));
    }
  });

  test('recently viewed products functionality', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Step 1: View multiple products
    await product.gotoProductDetail(testProducts[0].handle);
    await product.gotoProductDetail(testProducts[1].handle);
    await product.gotoProductDetail(testProducts[2].handle);

    // Step 2: Check recently viewed section
    const recentlyViewed = guestPage.locator('[data-testid="recently-viewed"]');
    if (await recentlyViewed.isVisible()) {
      const recentItems = recentlyViewed.locator('[data-testid="recent-item"]');
      await expect(recentItems).toHaveCount({ min: 2, max: 3 });
    }
  });

  test('product recommendations work correctly', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Step 1: View a product
    await product.gotoProductDetail(testProducts[0].handle);
    await product.verifyProductDetails();

    // Step 2: Check for related products
    const relatedProducts = guestPage.locator('[data-testid="related-products"]');
    if (await relatedProducts.isVisible()) {
      const relatedItems = relatedProducts.locator('[data-testid="product-card"]');
      await expect(relatedItems).toHaveCount({ min: 1 });
      
      // Click on a related product
      await relatedItems.first().click();
      await product.verifyProductDetails();
    }
  });

  test('pagination works correctly', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Step 1: Go to products page with many items
    await product.gotoProductListing();
    await product.verifyProductGrid();

    // Step 2: Check if pagination exists
    if (await product.pagination.isVisible()) {
      await product.verifyPaginationExists();
      
      // Step 3: Navigate to next page
      await product.navigateToPagination(2);
      await product.verifyProductGrid();
      
      // Verify URL reflects page number
      await expect(guestPage).toHaveURL(/page=2/);
      
      // Step 4: Navigate back to first page
      await product.navigateToPagination(1);
      await expect(guestPage).toHaveURL(/page=1|(?!page=)/);
    }
  });
});

test.describe('Mobile Product Discovery', () => {
  test('product discovery works on mobile devices', async ({ guestPage }) => {
    // Set mobile viewport
    await guestPage.setViewportSize({ width: 375, height: 667 });

    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);

    // Test mobile navigation
    await home.goto();
    await home.verifyResponsiveDesign();

    // Test mobile search
    await home.searchProduct('smartphone');
    await product.verifyProductGrid();

    // Test mobile product detail
    await product.clickProduct(testProducts[0].title);
    await product.verifyProductDetails();
    await product.verifyProductImages();

    // Test mobile filters (usually in a drawer/modal)
    await product.gotoProductListing();
    const mobileFilters = guestPage.locator('[data-testid="mobile-filters-toggle"]');
    if (await mobileFilters.isVisible()) {
      await mobileFilters.click();
      await expect(guestPage.locator('[data-testid="mobile-filters-drawer"]')).toBeVisible();
    }
  });
});