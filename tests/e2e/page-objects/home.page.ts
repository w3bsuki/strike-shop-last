/**
 * Home Page Object Model
 * Encapsulates interactions with the home page
 */

import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly heroSection: Locator;
  readonly featuredProducts: Locator;
  readonly categoryGrid: Locator;
  readonly searchInput: Locator;
  readonly cartIcon: Locator;
  readonly userMenu: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroSection = page.locator('[data-testid="hero-section"]');
    this.featuredProducts = page.locator('[data-testid="featured-products"]');
    this.categoryGrid = page.locator('[data-testid="category-grid"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.navigationMenu = page.locator('[data-testid="navigation-menu"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async searchProduct(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    await this.page.waitForURL('**/products?search=*');
  }

  async navigateToCategory(categoryName: string) {
    await this.navigationMenu.getByText(categoryName).click();
    await this.page.waitForLoadState('networkidle');
  }

  async openCart() {
    await this.cartIcon.click();
    await expect(this.page.locator('[data-testid="cart-sidebar"]')).toBeVisible();
  }

  async openUserMenu() {
    await this.userMenu.click();
    await expect(this.page.locator('[data-testid="user-dropdown"]')).toBeVisible();
  }

  async verifyFeaturedProducts() {
    await expect(this.featuredProducts).toBeVisible();
    const productCards = this.featuredProducts.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCount({ min: 1 });
  }

  async verifyHeroSection() {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heroSection.locator('h1')).toContainText(/Strike|Shop|Welcome/i);
  }

  async verifyCategoryGrid() {
    await expect(this.categoryGrid).toBeVisible();
    const categoryCards = this.categoryGrid.locator('[data-testid="category-card"]');
    await expect(categoryCards).toHaveCount({ min: 1 });
  }

  async clickFeaturedProduct(productTitle: string) {
    const productCard = this.featuredProducts
      .locator('[data-testid="product-card"]')
      .filter({ hasText: productTitle });
    
    await productCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoad() {
    await expect(this.page).toHaveTitle(/Strike Shop|Home/i);
    await expect(this.heroSection).toBeVisible();
    await expect(this.navigationMenu).toBeVisible();
    await expect(this.cartIcon).toBeVisible();
  }

  async verifyResponsiveDesign() {
    // Test mobile breakpoint
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.navigationMenu).toBeVisible();
    
    // Test tablet breakpoint
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.categoryGrid).toBeVisible();
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }
}