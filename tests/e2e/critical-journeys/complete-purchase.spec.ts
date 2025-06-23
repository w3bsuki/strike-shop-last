/**
 * Complete Purchase E2E Test
 * Tests the entire user journey from product discovery to order completion
 * This is the most critical user journey for e-commerce success
 */

import { test, expect } from '../fixtures/auth';
import { HomePage } from '../page-objects/home.page';
import { ProductPage } from '../page-objects/product.page';
import { CartPage } from '../page-objects/cart.page';
import { CheckoutPage } from '../page-objects/checkout.page';
import { testUsers, testProducts } from '../fixtures/data';

test.describe('Complete Purchase Journey', () => {
  test('guest user can complete full purchase journey', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Step 1: Start on homepage
    await home.goto();
    await home.verifyPageLoad();

    // Step 2: Browse and search for products
    await home.searchProduct('smartphone');
    await product.verifySearchResults('smartphone');
    await product.verifyProductGrid();

    // Step 3: View product details
    await product.clickProduct(testProducts[0].title);
    await product.verifyProductDetails();
    await product.verifyProductAvailability();

    // Step 4: Add product to cart
    await product.setQuantity(1);
    await product.addToCart();

    // Step 5: Verify cart contents
    await cart.openCart();
    await cart.verifyCartHasItems(1);
    await cart.verifyCartItem(testProducts[0].title, 1, '$699.99');

    // Step 6: Add another product to cart
    await cart.continueShopping();
    await product.gotoProductDetail(testProducts[2].handle);
    await product.addToCart();

    // Step 7: Verify updated cart
    await cart.openCart();
    await cart.verifyCartHasItems(2);
    await cart.verifyCartTotals('$899.98', undefined, undefined, '$899.98');

    // Step 8: Proceed to checkout
    await cart.proceedToCheckout();
    await checkout.verifyCheckoutPage();

    // Step 9: Fill shipping information
    await checkout.fillShippingAddress(testUsers.customer);
    await checkout.selectShippingMethod('standard');
    await checkout.continueToPayment();

    // Step 10: Complete payment
    await checkout.selectPaymentMethod('card');
    await checkout.fillPaymentDetails(testUsers.customer.paymentMethod);
    await checkout.toggleBillingAddress(true);
    await checkout.verifyOrderSummary('$909.98'); // Including shipping

    // Step 11: Place order
    await checkout.completeOrder();

    // Step 12: Verify order confirmation
    await expect(guestPage).toHaveURL(/order-confirmation/);
    await expect(guestPage.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('authenticated user can complete purchase with saved information', async ({ authenticatedPage }) => {
    const home = new HomePage(authenticatedPage);
    const product = new ProductPage(authenticatedPage);
    const cart = new CartPage(authenticatedPage);
    const checkout = new CheckoutPage(authenticatedPage);

    // Step 1: Start on homepage (already authenticated)
    await home.goto();
    await home.verifyPageLoad();

    // Step 2: Add product directly from product grid
    await home.navigateToCategory('Electronics');
    await product.addProductToCartFromGrid(testProducts[1].title);

    // Step 3: Go directly to checkout
    await cart.openCart();
    await cart.proceedToCheckout();

    // Step 4: Verify pre-filled information (for authenticated users)
    await checkout.verifyCheckoutPage();
    
    // Shipping info should be pre-filled for authenticated users
    await expect(checkout.emailInput).toHaveValue(testUsers.customer.email);
    
    // Step 5: Select shipping and continue
    await checkout.selectShippingMethod('express');
    await checkout.continueToPayment();

    // Step 6: Complete payment with saved card
    await checkout.selectPaymentMethod('card');
    await checkout.verifyOrderSummary('$1,314.99'); // Including express shipping
    await checkout.completeOrder();

    // Step 7: Verify order confirmation
    await expect(authenticatedPage).toHaveURL(/order-confirmation/);
    await expect(authenticatedPage.locator('[data-testid="order-success"]')).toBeVisible();
  });

  test('user can recover abandoned cart and complete purchase', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Step 1: Add items to cart
    await home.goto();
    await product.gotoProductDetail(testProducts[0].handle);
    await product.addToCart();

    // Step 2: Start checkout process
    await cart.openCart();
    await cart.proceedToCheckout();
    await checkout.fillShippingAddress(testUsers.customer);

    // Step 3: Abandon cart (navigate away)
    await home.goto();
    await guestPage.waitForTimeout(1000);

    // Step 4: Return to cart and verify items persisted
    await cart.openCart();
    await cart.verifyCartHasItems(1);
    await cart.verifyCartPersistence();

    // Step 5: Complete the purchase
    await cart.proceedToCheckout();
    await checkout.continueToPayment();
    await checkout.selectPaymentMethod('card');
    await checkout.fillPaymentDetails(testUsers.customer.paymentMethod);
    await checkout.completeOrder();

    // Step 6: Verify successful completion
    await expect(guestPage).toHaveURL(/order-confirmation/);
  });

  test('user can handle payment failures gracefully', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Step 1: Setup cart and proceed to payment
    await home.goto();
    await product.gotoProductDetail(testProducts[2].handle);
    await product.addToCart();
    await cart.openCart();
    await cart.proceedToCheckout();
    await checkout.fillShippingAddress(testUsers.customer);
    await checkout.continueToPayment();

    // Step 2: Use declined test card
    await checkout.selectPaymentMethod('card');
    const declinedCard = {
      cardNumber: '4000000000000002', // Stripe test card that will be declined
      expiryMonth: '12',
      expiryYear: '2030',
      cvc: '123',
      name: 'Test Customer',
    };
    await checkout.fillPaymentDetails(declinedCard);

    // Step 3: Attempt payment and handle failure
    await checkout.completeOrder();
    await checkout.handlePaymentError();

    // Step 4: Retry with valid card
    const validCard = testUsers.customer.paymentMethod;
    await checkout.fillPaymentDetails(validCard);
    await checkout.completeOrder();

    // Step 5: Verify successful completion after retry
    await expect(guestPage).toHaveURL(/order-confirmation/);
  });

  test('user can apply discount codes during checkout', async ({ guestPage }) => {
    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Step 1: Add items to cart
    await home.goto();
    await product.gotoProductDetail(testProducts[1].handle);
    await product.setQuantity(2);
    await product.addToCart();

    // Step 2: Apply discount in cart
    await cart.openCart();
    await cart.applyCoupon('TEST10');
    await cart.verifyDiscountApplied('-$259.99'); // 10% off $2599.98

    // Step 3: Proceed to checkout with discount
    await cart.proceedToCheckout();
    await checkout.verifyOrderSummary('$2,349.99'); // After discount + shipping

    // Step 4: Complete purchase with discount
    await checkout.fillShippingAddress(testUsers.customer);
    await checkout.continueToPayment();
    await checkout.selectPaymentMethod('card');
    await checkout.fillPaymentDetails(testUsers.customer.paymentMethod);
    await checkout.completeOrder();

    // Step 5: Verify order confirmation shows discount
    await expect(guestPage).toHaveURL(/order-confirmation/);
    await expect(guestPage.locator('[data-testid="order-discount"]')).toContainText('TEST10');
  });

  test('user journey works on mobile devices', async ({ guestPage }) => {
    // Set mobile viewport
    await guestPage.setViewportSize({ width: 375, height: 667 });

    const home = new HomePage(guestPage);
    const product = new ProductPage(guestPage);
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Complete full mobile purchase journey
    await home.goto();
    await home.verifyResponsiveDesign();
    
    await product.gotoProductDetail(testProducts[0].handle);
    await product.addToCart();
    
    await cart.verifyCartResponsive();
    await cart.openCart();
    await cart.proceedToCheckout();
    
    await checkout.verifyResponsiveCheckout();
    await checkout.fillShippingAddress(testUsers.customer);
    await checkout.continueToPayment();
    await checkout.selectPaymentMethod('card');
    await checkout.fillPaymentDetails(testUsers.customer.paymentMethod);
    await checkout.completeOrder();

    await expect(guestPage).toHaveURL(/order-confirmation/);
  });
});

test.describe('Edge Cases and Error Handling', () => {
  test('handles out of stock products gracefully', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);

    // Navigate to out of stock product
    await product.gotoProductDetail('out-of-stock-product');
    await product.verifyProductOutOfStock();
    
    // Verify add to cart is disabled
    await expect(product.addToCartButton).toBeDisabled();
  });

  test('prevents checkout with empty cart', async ({ guestPage }) => {
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Try to access checkout with empty cart
    await checkout.gotoCheckout();
    
    // Should redirect to cart or show empty cart message
    await expect(guestPage).toHaveURL(/cart/);
    await cart.verifyCartEmpty();
  });

  test('validates form inputs during checkout', async ({ guestPage }) => {
    const product = new ProductPage(guestPage);
    const cart = new CartPage(guestPage);
    const checkout = new CheckoutPage(guestPage);

    // Setup cart
    await product.gotoProductDetail(testProducts[0].handle);
    await product.addToCart();
    await cart.openCart();
    await cart.proceedToCheckout();

    // Test form validation
    await checkout.verifyFormValidation();
    await checkout.verifyEmailValidation();
    
    // Test payment validation
    await checkout.fillShippingAddress(testUsers.customer);
    await checkout.continueToPayment();
    await checkout.verifyCardValidation();
  });
});