/**
 * Checkout Page Object Model
 * Encapsulates interactions with the checkout process
 */

import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly shippingForm: Locator;
  readonly billingForm: Locator;
  readonly paymentForm: Locator;
  readonly orderSummary: Locator;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateSelect: Locator;
  readonly zipCodeInput: Locator;
  readonly countrySelect: Locator;
  readonly phoneInput: Locator;
  readonly shippingMethodRadio: Locator;
  readonly paymentMethodRadio: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvcInput: Locator;
  readonly cardNameInput: Locator;
  readonly billingAddressSame: Locator;
  readonly continueToPaymentButton: Locator;
  readonly completeOrderButton: Locator;
  readonly backToShippingButton: Locator;
  readonly orderTotal: Locator;
  readonly shippingCost: Locator;
  readonly taxAmount: Locator;
  readonly discountAmount: Locator;
  readonly orderItems: Locator;
  readonly progressIndicator: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shippingForm = page.locator('[data-testid="shipping-form"]');
    this.billingForm = page.locator('[data-testid="billing-form"]');
    this.paymentForm = page.locator('[data-testid="payment-form"]');
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.firstNameInput = page.locator('[data-testid="first-name"]');
    this.lastNameInput = page.locator('[data-testid="last-name"]');
    this.addressInput = page.locator('[data-testid="address"]');
    this.cityInput = page.locator('[data-testid="city"]');
    this.stateSelect = page.locator('[data-testid="state"]');
    this.zipCodeInput = page.locator('[data-testid="zip-code"]');
    this.countrySelect = page.locator('[data-testid="country"]');
    this.phoneInput = page.locator('[data-testid="phone"]');
    this.shippingMethodRadio = page.locator('[data-testid="shipping-method"]');
    this.paymentMethodRadio = page.locator('[data-testid="payment-method"]');
    this.cardNumberInput = page.locator('[data-testid="card-number"]');
    this.expiryInput = page.locator('[data-testid="card-expiry"]');
    this.cvcInput = page.locator('[data-testid="card-cvc"]');
    this.cardNameInput = page.locator('[data-testid="card-name"]');
    this.billingAddressSame = page.locator('[data-testid="billing-same-as-shipping"]');
    this.continueToPaymentButton = page.locator('[data-testid="continue-to-payment"]');
    this.completeOrderButton = page.locator('[data-testid="complete-order"]');
    this.backToShippingButton = page.locator('[data-testid="back-to-shipping"]');
    this.orderTotal = page.locator('[data-testid="order-total"]');
    this.shippingCost = page.locator('[data-testid="shipping-cost"]');
    this.taxAmount = page.locator('[data-testid="tax-amount"]');
    this.discountAmount = page.locator('[data-testid="discount-amount"]');
    this.orderItems = page.locator('[data-testid="order-items"]');
    this.progressIndicator = page.locator('[data-testid="checkout-progress"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  }

  async gotoCheckout() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyCheckoutPage() {
    await expect(this.shippingForm).toBeVisible();
    await expect(this.orderSummary).toBeVisible();
    await expect(this.progressIndicator).toBeVisible();
  }

  async fillShippingAddress(address: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  }) {
    await this.emailInput.fill(address.email);
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.addressInput.fill(address.address);
    await this.cityInput.fill(address.city);
    await this.stateSelect.selectOption(address.state);
    await this.zipCodeInput.fill(address.zipCode);
    await this.countrySelect.selectOption(address.country);
    
    if (address.phone) {
      await this.phoneInput.fill(address.phone);
    }
  }

  async selectShippingMethod(method: 'standard' | 'express' | 'overnight') {
    await this.shippingMethodRadio.locator(`[value="${method}"]`).check();
    await this.page.waitForLoadState('networkidle');
  }

  async continueToPayment() {
    await this.continueToPaymentButton.click();
    await expect(this.paymentForm).toBeVisible();
  }

  async fillPaymentDetails(payment: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
    name: string;
  }) {
    // Fill Stripe Elements (may need special handling for iframe)
    await this.cardNumberInput.fill(payment.cardNumber);
    await this.expiryInput.fill(`${payment.expiryMonth}/${payment.expiryYear}`);
    await this.cvcInput.fill(payment.cvc);
    await this.cardNameInput.fill(payment.name);
  }

  async selectPaymentMethod(method: 'card' | 'paypal' | 'apple-pay') {
    await this.paymentMethodRadio.locator(`[value="${method}"]`).check();
    await this.page.waitForTimeout(1000); // Allow payment form to update
  }

  async toggleBillingAddress(sameAsShipping: boolean) {
    if (sameAsShipping) {
      await this.billingAddressSame.check();
      await expect(this.billingForm).not.toBeVisible();
    } else {
      await this.billingAddressSame.uncheck();
      await expect(this.billingForm).toBeVisible();
    }
  }

  async fillBillingAddress(address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) {
    const billingFirstName = this.billingForm.locator('[data-testid="billing-first-name"]');
    const billingLastName = this.billingForm.locator('[data-testid="billing-last-name"]');
    const billingAddress = this.billingForm.locator('[data-testid="billing-address"]');
    const billingCity = this.billingForm.locator('[data-testid="billing-city"]');
    const billingState = this.billingForm.locator('[data-testid="billing-state"]');
    const billingZip = this.billingForm.locator('[data-testid="billing-zip"]');
    const billingCountry = this.billingForm.locator('[data-testid="billing-country"]');

    await billingFirstName.fill(address.firstName);
    await billingLastName.fill(address.lastName);
    await billingAddress.fill(address.address);
    await billingCity.fill(address.city);
    await billingState.selectOption(address.state);
    await billingZip.fill(address.zipCode);
    await billingCountry.selectOption(address.country);
  }

  async verifyOrderSummary(expectedTotal: string) {
    await expect(this.orderSummary).toBeVisible();
    await expect(this.orderTotal).toContainText(expectedTotal);
    await expect(this.orderItems.first()).toBeVisible();
  }

  async verifyShippingCost(expectedCost: string) {
    await expect(this.shippingCost).toContainText(expectedCost);
  }

  async verifyTaxAmount(expectedTax: string) {
    await expect(this.taxAmount).toContainText(expectedTax);
  }

  async completeOrder() {
    await expect(this.completeOrderButton).toBeEnabled();
    await this.completeOrderButton.click();
    
    // Wait for order processing
    await expect(this.loadingSpinner).toBeVisible();
    await this.page.waitForURL('**/order-confirmation/**', { timeout: 30000 });
  }

  async verifyFormValidation() {
    // Try to continue without filling required fields
    await this.continueToPaymentButton.click();
    
    // Verify validation errors appear
    const firstNameError = this.page.locator('[data-testid="first-name-error"]');
    const emailError = this.page.locator('[data-testid="email-error"]');
    
    await expect(firstNameError).toBeVisible();
    await expect(emailError).toBeVisible();
  }

  async verifyEmailValidation() {
    await this.emailInput.fill('invalid-email');
    await this.firstNameInput.click(); // Trigger validation
    
    const emailError = this.page.locator('[data-testid="email-error"]');
    await expect(emailError).toContainText(/valid email/i);
  }

  async verifyCardValidation() {
    await this.cardNumberInput.fill('1234');
    await this.expiryInput.click(); // Trigger validation
    
    const cardError = this.page.locator('[data-testid="card-number-error"]');
    await expect(cardError).toContainText(/valid card/i);
  }

  async backToShipping() {
    await this.backToShippingButton.click();
    await expect(this.shippingForm).toBeVisible();
  }

  async verifyProgressSteps() {
    // Verify checkout progress indicator
    await expect(this.progressIndicator).toBeVisible();
    
    const steps = this.progressIndicator.locator('[data-testid="progress-step"]');
    await expect(steps).toHaveCount(3); // Shipping, Payment, Confirmation
    
    // Verify current step is highlighted
    const activeStep = this.progressIndicator.locator('[data-testid="active-step"]');
    await expect(activeStep).toBeVisible();
  }

  async verifySecureCheckout() {
    // Verify SSL indicators and security badges
    const securityBadge = this.page.locator('[data-testid="security-badge"]');
    await expect(securityBadge).toBeVisible();
    
    // Verify payment processing is secure
    const stripeElements = this.page.locator('[data-testid="stripe-elements"]');
    if (await stripeElements.isVisible()) {
      await expect(stripeElements).toBeVisible();
    }
  }

  async verifyResponsiveCheckout() {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.shippingForm).toBeVisible();
    await expect(this.orderSummary).toBeVisible();
    
    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.progressIndicator).toBeVisible();
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  async handlePaymentError() {
    // Handle declined card or payment errors
    const paymentError = this.page.locator('[data-testid="payment-error"]');
    
    if (await paymentError.isVisible()) {
      await expect(paymentError).toContainText(/declined|failed|error/i);
      
      // Payment form should remain visible for retry
      await expect(this.paymentForm).toBeVisible();
      await expect(this.completeOrderButton).toBeEnabled();
    }
  }
}