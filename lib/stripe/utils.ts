// Stripe Utility Functions
import type { CartItem } from '@/types/cart';
import type { OrderTotals, OrderItem } from './types';

/**
 * Convert cart items to order items
 */
export function cartToOrderItems(cartItems: CartItem[]): OrderItem[] {
  return cartItems.map(item => ({
    variantId: item.merchandise.id,
    productId: item.merchandise.product.id,
    quantity: item.quantity,
    price: parseFloat(item.merchandise.price.amount),
    title: item.merchandise.product.title,
    image: item.merchandise.product.images.nodes[0]?.url
  }));
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(
  items: OrderItem[],
  shippingCost: number = 0,
  taxRate: number = 0.08875 // Default NY tax rate
): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shippingCost * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Convert dollars to Stripe cents
 */
export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert Stripe cents to dollars
 */
export function centsToDollars(amount: number): number {
  return Math.round(amount) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Validate checkout form data
 */
export function validateCheckoutForm(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }

  // Name validation
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full name is required');
  }

  // Address validation
  if (!data.address?.line1 || data.address.line1.trim().length < 5) {
    errors.push('Street address is required');
  }

  if (!data.address?.city || data.address.city.trim().length < 2) {
    errors.push('City is required');
  }

  if (!data.address?.state || data.address.state.trim().length < 2) {
    errors.push('State is required');
  }

  if (!data.address?.postal_code || !/^\d{5}(-\d{4})?$/.test(data.address.postal_code)) {
    errors.push('Valid postal code is required');
  }

  if (!data.address?.country || data.address.country.trim().length < 2) {
    errors.push('Country is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate order reference number
 */
export function generateOrderReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER-${timestamp}-${random}`.toUpperCase();
}

/**
 * Calculate shipping cost based on location and weight
 */
export function calculateShippingCost(
  address: { state: string; country: string },
  totalWeight: number = 1
): number {
  // Simple shipping calculation - in production, use a proper shipping API
  const baseRate = 5.99;
  const weightRate = Math.max(0, (totalWeight - 1) * 2.50);
  
  // International shipping
  if (address.country !== 'US') {
    return baseRate * 3 + weightRate;
  }
  
  // Domestic shipping
  return baseRate + weightRate;
}

/**
 * Get tax rate by location
 */
export function getTaxRate(address: { state: string; country: string }): number {
  // Simple tax calculation - in production, use a proper tax service
  const taxRates: Record<string, number> = {
    'NY': 0.08875,
    'CA': 0.0725,
    'TX': 0.0625,
    'FL': 0.06,
    'WA': 0.065,
  };

  if (address.country !== 'US') {
    return 0; // Handle international tax separately
  }

  return taxRates[address.state.toUpperCase()] || 0.05; // Default 5%
}

/**
 * Parse Stripe error for user-friendly message
 */
export function parseStripeError(error: any): string {
  if (error.type === 'card_error') {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different card.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'incorrect_number':
        return 'Your card number is incorrect.';
      default:
        return error.message || 'Your card could not be processed.';
    }
  }
  
  if (error.type === 'validation_error') {
    return error.message || 'Please check your payment information.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}