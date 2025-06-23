/**
 * Product Page Object Model
 * Encapsulates interactions with product listing and detail pages
 */

import { Page, Locator, expect } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly productGrid: Locator;
  readonly productCard: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly addToCartButton: Locator;
  readonly addToWishlistButton: Locator;
  readonly quantitySelector: Locator;
  readonly variantSelector: Locator;
  readonly productDescription: Locator;
  readonly productReviews: Locator;
  readonly filterSidebar: Locator;
  readonly sortDropdown: Locator;
  readonly pagination: Locator;
  readonly searchResults: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productGrid = page.locator('[data-testid="product-grid"]');
    this.productCard = page.locator('[data-testid="product-card"]');
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productImage = page.locator('[data-testid="product-image"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.addToWishlistButton = page.locator('[data-testid="add-to-wishlist"]');
    this.quantitySelector = page.locator('[data-testid="quantity-selector"]');
    this.variantSelector = page.locator('[data-testid="variant-selector"]');
    this.productDescription = page.locator('[data-testid="product-description"]');
    this.productReviews = page.locator('[data-testid="product-reviews"]');
    this.filterSidebar = page.locator('[data-testid="filter-sidebar"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.pagination = page.locator('[data-testid="pagination"]');
    this.searchResults = page.locator('[data-testid="search-results"]');
  }

  // Product Listing Page Methods
  async gotoProductListing() {
    await this.page.goto('/products');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoCategory(categoryHandle: string) {
    await this.page.goto(`/categories/${categoryHandle}`);
    await this.page.waitForLoadState('networkidle');
  }

  async searchProducts(searchTerm: string) {
    await this.page.goto(`/products?search=${encodeURIComponent(searchTerm)}`);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByPrice(minPrice: number, maxPrice: number) {
    await this.filterSidebar.locator('[data-testid="price-filter-min"]').fill(minPrice.toString());
    await this.filterSidebar.locator('[data-testid="price-filter-max"]').fill(maxPrice.toString());
    await this.filterSidebar.locator('[data-testid="apply-price-filter"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(categoryName: string) {
    await this.filterSidebar.locator(`[data-testid="category-filter-${categoryName}"]`).check();
    await this.page.waitForLoadState('networkidle');
  }

  async sortProducts(sortOption: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest') {
    await this.sortDropdown.selectOption(sortOption);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyProductGrid() {
    await expect(this.productGrid).toBeVisible();
    await expect(this.productCard.first()).toBeVisible();
  }

  async verifyProductCount(expectedCount: number) {
    await expect(this.productCard).toHaveCount(expectedCount);
  }

  async verifySearchResults(searchTerm: string) {
    await expect(this.searchResults).toBeVisible();
    await expect(this.searchResults).toContainText(`Results for "${searchTerm}"`);
  }

  async clickProduct(productTitle: string) {
    const product = this.productCard.filter({ hasText: productTitle });
    await product.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addProductToCartFromGrid(productTitle: string) {
    const product = this.productCard.filter({ hasText: productTitle });
    await product.locator('[data-testid="quick-add-to-cart"]').click();
    
    // Wait for cart update notification
    await expect(this.page.locator('[data-testid="cart-notification"]')).toBeVisible();
  }

  async addProductToWishlistFromGrid(productTitle: string) {
    const product = this.productCard.filter({ hasText: productTitle });
    await product.locator('[data-testid="add-to-wishlist"]').click();
    
    // Wait for wishlist update notification
    await expect(this.page.locator('[data-testid="wishlist-notification"]')).toBeVisible();
  }

  // Product Detail Page Methods
  async gotoProductDetail(productHandle: string) {
    await this.page.goto(`/products/${productHandle}`);
    await this.page.waitForLoadState('networkidle');
  }

  async selectVariant(variantOption: string) {
    await this.variantSelector.selectOption(variantOption);
    await this.page.waitForSelector('[data-testid="variant-price"]');
  }

  async setQuantity(quantity: number) {
    await this.quantitySelector.fill(quantity.toString());
  }

  async addToCart() {
    await this.addToCartButton.click();
    
    // Wait for cart update
    await expect(this.page.locator('[data-testid="cart-notification"]')).toBeVisible();
  }

  async addToWishlist() {
    await this.addToWishlistButton.click();
    
    // Wait for wishlist update
    await expect(this.page.locator('[data-testid="wishlist-notification"]')).toBeVisible();
  }

  async verifyProductDetails() {
    await expect(this.productTitle).toBeVisible();
    await expect(this.productPrice).toBeVisible();
    await expect(this.productImage).toBeVisible();
    await expect(this.productDescription).toBeVisible();
    await expect(this.addToCartButton).toBeVisible();
  }

  async verifyProductAvailability() {
    await expect(this.addToCartButton).toBeEnabled();
    await expect(this.quantitySelector).toBeVisible();
  }

  async verifyProductOutOfStock() {
    await expect(this.addToCartButton).toBeDisabled();
    await expect(this.page.locator('[data-testid="out-of-stock-message"]')).toBeVisible();
  }

  async verifyProductPrice(expectedPrice: string) {
    await expect(this.productPrice).toContainText(expectedPrice);
  }

  async verifyProductImages() {
    const images = this.page.locator('[data-testid="product-image"]');
    await expect(images.first()).toBeVisible();
    
    // Verify image loads successfully
    const firstImage = images.first();
    await expect(firstImage).toHaveAttribute('src', /.+/);
  }

  async navigateProductImages() {
    const nextButton = this.page.locator('[data-testid="image-next"]');
    const prevButton = this.page.locator('[data-testid="image-prev"]');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await this.page.waitForTimeout(500); // Allow animation
      await prevButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async verifyReviews() {
    if (await this.productReviews.isVisible()) {
      const reviews = this.productReviews.locator('[data-testid="review-item"]');
      await expect(reviews.first()).toBeVisible();
    }
  }

  async navigateToPagination(pageNumber: number) {
    await this.pagination.locator(`[data-testid="page-${pageNumber}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPaginationExists() {
    await expect(this.pagination).toBeVisible();
  }
}