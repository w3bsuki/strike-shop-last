/**
 * Cart Page Object Model
 * Encapsulates interactions with shopping cart functionality
 */

import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartSidebar: Locator;
  readonly cartIcon: Locator;
  readonly cartItems: Locator;
  readonly cartItemQuantity: Locator;
  readonly cartItemPrice: Locator;
  readonly cartSubtotal: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly removeItemButton: Locator;
  readonly updateQuantityButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly cartBadge: Locator;
  readonly couponInput: Locator;
  readonly applyCouponButton: Locator;
  readonly discountSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartSidebar = page.locator('[data-testid="cart-sidebar"]');
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.cartItemQuantity = page.locator('[data-testid="cart-item-quantity"]');
    this.cartItemPrice = page.locator('[data-testid="cart-item-price"]');
    this.cartSubtotal = page.locator('[data-testid="cart-subtotal"]');
    this.cartTotal = page.locator('[data-testid="cart-total"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping"]');
    this.removeItemButton = page.locator('[data-testid="remove-item"]');
    this.updateQuantityButton = page.locator('[data-testid="update-quantity"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart-message"]');
    this.cartBadge = page.locator('[data-testid="cart-badge"]');
    this.couponInput = page.locator('[data-testid="coupon-input"]');
    this.applyCouponButton = page.locator('[data-testid="apply-coupon"]');
    this.discountSection = page.locator('[data-testid="discount-section"]');
  }

  async openCart() {
    await this.cartIcon.click();
    await expect(this.cartSidebar).toBeVisible();
  }

  async closeCart() {
    const closeButton = this.cartSidebar.locator('[data-testid="close-cart"]');
    await closeButton.click();
    await expect(this.cartSidebar).not.toBeVisible();
  }

  async gotoCartPage() {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyCartEmpty() {
    await expect(this.emptyCartMessage).toBeVisible();
    await expect(this.emptyCartMessage).toContainText(/empty|no items/i);
    await expect(this.cartBadge).not.toBeVisible();
  }

  async verifyCartHasItems(expectedCount: number) {
    await expect(this.cartItems).toHaveCount(expectedCount);
    await expect(this.cartBadge).toContainText(expectedCount.toString());
  }

  async verifyCartItem(productTitle: string, quantity: number, price: string) {
    const cartItem = this.cartItems.filter({ hasText: productTitle });
    await expect(cartItem).toBeVisible();
    
    const itemQuantity = cartItem.locator('[data-testid="item-quantity"]');
    await expect(itemQuantity).toHaveValue(quantity.toString());
    
    const itemPrice = cartItem.locator('[data-testid="item-price"]');
    await expect(itemPrice).toContainText(price);
  }

  async updateItemQuantity(productTitle: string, newQuantity: number) {
    const cartItem = this.cartItems.filter({ hasText: productTitle });
    const quantityInput = cartItem.locator('[data-testid="quantity-input"]');
    
    await quantityInput.fill(newQuantity.toString());
    await cartItem.locator('[data-testid="update-quantity"]').click();
    
    // Wait for cart update
    await this.page.waitForLoadState('networkidle');
    await expect(quantityInput).toHaveValue(newQuantity.toString());
  }

  async removeItem(productTitle: string) {
    const cartItem = this.cartItems.filter({ hasText: productTitle });
    await cartItem.locator('[data-testid="remove-item"]').click();
    
    // Confirm removal if modal appears
    const confirmButton = this.page.locator('[data-testid="confirm-remove"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Wait for item to be removed
    await expect(cartItem).not.toBeVisible();
  }

  async verifyCartTotals(subtotal: string, tax?: string, shipping?: string, total?: string) {
    await expect(this.cartSubtotal).toContainText(subtotal);
    
    if (tax) {
      const taxElement = this.page.locator('[data-testid="cart-tax"]');
      await expect(taxElement).toContainText(tax);
    }
    
    if (shipping) {
      const shippingElement = this.page.locator('[data-testid="cart-shipping"]');
      await expect(shippingElement).toContainText(shipping);
    }
    
    if (total) {
      await expect(this.cartTotal).toContainText(total);
    }
  }

  async applyCoupon(couponCode: string) {
    await this.couponInput.fill(couponCode);
    await this.applyCouponButton.click();
    
    // Wait for coupon application
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDiscountApplied(discountAmount: string) {
    await expect(this.discountSection).toBeVisible();
    await expect(this.discountSection).toContainText(discountAmount);
  }

  async verifyInvalidCoupon() {
    const errorMessage = this.page.locator('[data-testid="coupon-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid|expired|not found/i);
  }

  async proceedToCheckout() {
    await expect(this.checkoutButton).toBeEnabled();
    await this.checkoutButton.click();
    await this.page.waitForURL('**/checkout**');
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.page.waitForURL('**/products**');
  }

  async verifyCartPersistence() {
    // Refresh page and verify cart contents persist
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    
    // Cart should maintain items after refresh
    await this.openCart();
    await expect(this.cartItems.first()).toBeVisible();
  }

  async verifyCartMaxQuantity(productTitle: string, maxQuantity: number) {
    const cartItem = this.cartItems.filter({ hasText: productTitle });
    const quantityInput = cartItem.locator('[data-testid="quantity-input"]');
    
    // Try to set quantity above maximum
    await quantityInput.fill((maxQuantity + 1).toString());
    await cartItem.locator('[data-testid="update-quantity"]').click();
    
    // Verify error message or quantity cap
    const errorMessage = this.page.locator('[data-testid="quantity-error"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/maximum|limit|stock/i);
    } else {
      // Quantity should be capped at maximum
      await expect(quantityInput).toHaveValue(maxQuantity.toString());
    }
  }

  async verifyCartResponsive() {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.openCart();
    await expect(this.cartSidebar).toBeVisible();
    
    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.cartSidebar).toBeVisible();
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  async verifyCartAccessibility() {
    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    await expect(this.cartIcon).toBeFocused();
    
    await this.page.keyboard.press('Enter');
    await expect(this.cartSidebar).toBeVisible();
    
    // Test aria labels and roles
    await expect(this.cartIcon).toHaveAttribute('aria-label');
    await expect(this.cartSidebar).toHaveAttribute('role', 'dialog');
  }
}