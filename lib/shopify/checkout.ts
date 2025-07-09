/**
 * Shopify Checkout Service
 * Handles all checkout-related operations with proper error handling and logging
 */

import { ShopifyClient } from './client';
import { logger, metrics, captureShopifyError } from '@/lib/monitoring';
import type {
  Cart,
  CartLine,
  MailingAddressInput,
  AttributeInput,
} from './types';
import type {
  Checkout,
  CheckoutUpdate,
  CheckoutCreateOptions,
  CheckoutCreatePayload,
  CheckoutCustomerAssociateV2Payload,
  CheckoutEmailUpdateV2Payload,
  CheckoutShippingAddressUpdateV2Payload,
  CheckoutAttributesUpdateV2Payload,
  CheckoutDiscountCodeApplyV2Payload,
  CheckoutLineItemInput,
  CheckoutUserError,
  RateLimitInfo,
  AvailablePaymentMethod,
} from './types/checkout';
import { CountryCode, CurrencyCode } from './types';
import { 
  getAvailablePaymentMethodsForRegion,
  getRegionFromCountry,
  PAYMENT_REGIONS,
  type Currency
} from './payment-config';
import {
  CHECKOUT_CREATE,
  CHECKOUT_CUSTOMER_ASSOCIATE_V2,
  CHECKOUT_EMAIL_UPDATE_V2,
  CHECKOUT_SHIPPING_ADDRESS_UPDATE_V2,
  CHECKOUT_SHIPPING_LINE_UPDATE,
  CHECKOUT_ATTRIBUTES_UPDATE_V2,
  CHECKOUT_DISCOUNT_CODE_APPLY_V2,
  GET_CHECKOUT,
  CART_TO_CHECKOUT_QUERY,
} from './queries/checkout';
import { 
  calculateShippingRates, 
  validateShippingAddress,
  type ShippingRate 
} from './shipping';
import { 
  calculateTax,
  getTaxConfiguration,
  type TaxCalculationResult 
} from './tax';

export class ShopifyCheckoutService {
  private client: ShopifyClient;
  private rateLimitInfo: RateLimitInfo = {
    requestsRemaining: 100,
    requestsLimit: 100,
  };

  constructor(client: ShopifyClient) {
    this.client = client;
  }

  /**
   * Creates a new checkout from a cart
   */
  async createCheckout(cartId: string, options?: CheckoutCreateOptions): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
    checkoutUrl?: string;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating checkout from cart', { cartId, options });
      
      // First, get cart details to convert to checkout
      const cartResponse = await this.client.query<{ cart: Cart | null }>(
        CART_TO_CHECKOUT_QUERY,
        { cartId }
      );

      if (!cartResponse.cart) {
        throw new Error('Cart not found');
      }

      const cart = cartResponse.cart;
      
      // Convert cart lines to checkout line items
      const lineItems: CheckoutLineItemInput[] = cart.lines.edges.map(edge => ({
        variantId: edge.node.merchandise.id,
        quantity: edge.node.quantity,
        customAttributes: edge.node.attributes,
      }));

      // Validate shipping address if provided
      if (options?.shippingAddress) {
        const addressValidation = validateShippingAddress(
          options.shippingAddress,
          (options.shippingAddress.country || cart.buyerIdentity.countryCode || 'US') as CountryCode
        );
        
        if (!addressValidation.valid) {
          logger.warn('Invalid shipping address', { 
            errors: addressValidation.errors,
            address: options.shippingAddress,
          });
        }
      }

      // Prepare checkout input
      const checkoutInput = {
        lineItems,
        email: options?.email || cart.buyerIdentity.email,
        shippingAddress: options?.shippingAddress,
        note: options?.note || cart.note,
        customAttributes: options?.customAttributes || cart.attributes,
        allowPartialAddresses: options?.allowPartialAddresses ?? true,
        presentmentCurrencyCode: options?.presentmentCurrencyCode,
        buyerIdentity: options?.buyerIdentity || {
          countryCode: cart.buyerIdentity.countryCode,
        },
      };

      // Create checkout
      const response = await this.client.query<{ checkoutCreate: CheckoutCreatePayload }>(
        CHECKOUT_CREATE,
        { input: checkoutInput }
      );

      const payload = response.checkoutCreate;
      
      // Track metrics
      const duration = Date.now() - startTime;
      metrics.increment('checkout.create', {
        success: String(!!payload.checkout),
        duration: String(duration),
        hasErrors: String(payload.checkoutUserErrors.length > 0),
      });

      if (payload.checkoutUserErrors.length > 0) {
        logger.warn('Checkout creation had errors', { 
          errors: payload.checkoutUserErrors,
          cartId,
        });
      }

      if (payload.checkout) {
        logger.info('Checkout created successfully', {
          checkoutId: payload.checkout.id,
          checkoutUrl: payload.checkout.webUrl,
          totalPrice: payload.checkout.totalPriceV2,
        });
      }

      return {
        checkout: payload.checkout || null,
        errors: payload.checkoutUserErrors,
        checkoutUrl: payload.checkout?.webUrl,
      };
    } catch (error) {
      logger.error('Failed to create checkout', { error, cartId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { operation: 'createCheckout', cartId });
      
      metrics.increment('checkout.create.error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Updates checkout with new information
   */
  async updateCheckout(checkoutId: string, updates: CheckoutUpdate): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    const results = {
      checkout: null as Checkout | null,
      errors: [] as CheckoutUserError[],
    };

    try {
      logger.info('Updating checkout', { checkoutId, updates });

      // Update email if provided
      if (updates.email) {
        const emailResult = await this.updateEmail(checkoutId, updates.email);
        if (emailResult.errors.length > 0) {
          results.errors.push(...emailResult.errors);
        }
        if (emailResult.checkout) {
          results.checkout = emailResult.checkout;
        }
      }

      // Update shipping address if provided
      if (updates.shippingAddress) {
        const addressResult = await this.updateShippingAddress(checkoutId, updates.shippingAddress);
        if (addressResult.errors.length > 0) {
          results.errors.push(...addressResult.errors);
        }
        if (addressResult.checkout) {
          results.checkout = addressResult.checkout;
        }
      }

      // Apply discount code if provided
      if (updates.discountCode) {
        const discountResult = await this.applyDiscountCode(checkoutId, updates.discountCode);
        if (discountResult.errors.length > 0) {
          results.errors.push(...discountResult.errors);
        }
        if (discountResult.checkout) {
          results.checkout = discountResult.checkout;
        }
      }

      // Update attributes if provided
      if (updates.note !== undefined || updates.customAttributes) {
        const attributesResult = await this.updateAttributes(checkoutId, {
          note: updates.note,
          customAttributes: updates.customAttributes,
        });
        if (attributesResult.errors.length > 0) {
          results.errors.push(...attributesResult.errors);
        }
        if (attributesResult.checkout) {
          results.checkout = attributesResult.checkout;
        }
      }

      metrics.increment('checkout.update', {
        success: String(results.errors.length === 0),
        errorCount: String(results.errors.length),
      });

      return results;
    } catch (error) {
      logger.error('Failed to update checkout', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { operation: 'updateCheckout', checkoutId });
      throw error;
    }
  }

  /**
   * Retrieves checkout details
   */
  async getCheckout(checkoutId: string): Promise<Checkout | null> {
    try {
      logger.info('Fetching checkout', { checkoutId });

      const response = await this.client.query<{ node: Checkout | null }>(
        GET_CHECKOUT,
        { checkoutId }
      );

      if (!response.node) {
        logger.warn('Checkout not found', { checkoutId });
        return null;
      }

      metrics.increment('checkout.get', { found: 'true' });
      return response.node;
    } catch (error) {
      logger.error('Failed to get checkout', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { operation: 'getCheckout', checkoutId });
      
      metrics.increment('checkout.get.error');
      throw error;
    }
  }

  /**
   * Associates a customer with the checkout
   */
  async associateCustomerWithCheckout(
    checkoutId: string,
    customerAccessToken: string
  ): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    try {
      logger.info('Associating customer with checkout', { checkoutId });

      const response = await this.client.query<{
        checkoutCustomerAssociateV2: CheckoutCustomerAssociateV2Payload;
      }>(CHECKOUT_CUSTOMER_ASSOCIATE_V2, {
        checkoutId,
        customerAccessToken,
      });

      const payload = response.checkoutCustomerAssociateV2;

      if (payload.checkoutUserErrors.length > 0) {
        logger.warn('Customer association had errors', {
          errors: payload.checkoutUserErrors,
          checkoutId,
        });
      }

      metrics.increment('checkout.customer.associate', {
        success: String(!!payload.checkout),
        hasErrors: String(payload.checkoutUserErrors.length > 0),
      });

      return {
        checkout: payload.checkout || null,
        errors: payload.checkoutUserErrors,
      };
    } catch (error) {
      logger.error('Failed to associate customer with checkout', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { 
        operation: 'associateCustomerWithCheckout', 
        checkoutId,
      });
      throw error;
    }
  }

  /**
   * Marks checkout as complete (for tracking purposes)
   */
  async completeCheckout(checkoutId: string): Promise<{
    success: boolean;
    order?: any;
  }> {
    try {
      logger.info('Marking checkout as complete', { checkoutId });

      // Get checkout to verify it's completed
      const checkout = await this.getCheckout(checkoutId);
      
      if (!checkout) {
        throw new Error('Checkout not found');
      }

      if (!checkout.completedAt) {
        logger.warn('Checkout not yet completed', { checkoutId });
        return { success: false };
      }

      metrics.increment('checkout.complete', {
        checkoutId,
        totalPrice: checkout.totalPriceV2.amount,
        currency: checkout.totalPriceV2.currencyCode,
      });

      return {
        success: true,
        order: checkout.order,
      };
    } catch (error) {
      logger.error('Failed to complete checkout', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { operation: 'completeCheckout', checkoutId });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async updateEmail(checkoutId: string, email: string): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    const response = await this.client.query<{
      checkoutEmailUpdateV2: CheckoutEmailUpdateV2Payload;
    }>(CHECKOUT_EMAIL_UPDATE_V2, { checkoutId, email });

    return {
      checkout: response.checkoutEmailUpdateV2.checkout || null,
      errors: response.checkoutEmailUpdateV2.checkoutUserErrors,
    };
  }

  private async updateShippingAddress(
    checkoutId: string,
    shippingAddress: MailingAddressInput
  ): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    const response = await this.client.query<{
      checkoutShippingAddressUpdateV2: CheckoutShippingAddressUpdateV2Payload;
    }>(CHECKOUT_SHIPPING_ADDRESS_UPDATE_V2, { checkoutId, shippingAddress });

    return {
      checkout: response.checkoutShippingAddressUpdateV2.checkout || null,
      errors: response.checkoutShippingAddressUpdateV2.checkoutUserErrors,
    };
  }

  private async applyDiscountCode(checkoutId: string, discountCode: string): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    const response = await this.client.query<{
      checkoutDiscountCodeApplyV2: CheckoutDiscountCodeApplyV2Payload;
    }>(CHECKOUT_DISCOUNT_CODE_APPLY_V2, { checkoutId, discountCode });

    return {
      checkout: response.checkoutDiscountCodeApplyV2.checkout || null,
      errors: response.checkoutDiscountCodeApplyV2.checkoutUserErrors,
    };
  }

  private async updateAttributes(
    checkoutId: string,
    input: { note?: string; customAttributes?: AttributeInput[] }
  ): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    const response = await this.client.query<{
      checkoutAttributesUpdateV2: CheckoutAttributesUpdateV2Payload;
    }>(CHECKOUT_ATTRIBUTES_UPDATE_V2, { checkoutId, input });

    return {
      checkout: response.checkoutAttributesUpdateV2.checkout || null,
      errors: response.checkoutAttributesUpdateV2.checkoutUserErrors,
    };
  }

  /**
   * Rate limiting helpers
   */
  checkRateLimit(): boolean {
    return this.rateLimitInfo.requestsRemaining > 5;
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Get available payment methods for a checkout
   */
  async getAvailablePaymentMethods(checkoutId: string): Promise<{
    methods: AvailablePaymentMethod[];
    supportedCurrencies: Currency[];
    defaultCurrency: Currency;
  }> {
    try {
      logger.info('Getting available payment methods', { checkoutId });
      
      // Get checkout to determine region and amount
      const checkout = await this.getCheckout(checkoutId);
      
      if (!checkout) {
        throw new Error('Checkout not found');
      }
      
      const countryCode = checkout.shippingAddress?.countryCodeV2 || 
                         checkout.buyerIdentity?.countryCode || 
                         'US';
      const region = getRegionFromCountry(countryCode);
      const amount = parseFloat(checkout.subtotalPriceV2.amount);
      const currency = checkout.presentmentCurrencyCode as Currency || 'USD';
      
      // Get payment methods for the region
      const methods = getAvailablePaymentMethodsForRegion(region, amount, currency);
      
      // Get supported currencies for the region
      const regionConfig = PAYMENT_REGIONS[region] || PAYMENT_REGIONS.US;
      
      metrics.increment('checkout.payment_methods.get', {
        region,
        methodCount: String(methods.length),
        currency,
      });
      
      return {
        methods: methods.map(method => ({
          ...method,
          enabled: method.available,
        })),
        supportedCurrencies: regionConfig?.currencies || ['USD'],
        defaultCurrency: regionConfig?.defaultCurrency || 'USD',
      };
    } catch (error) {
      logger.error('Failed to get payment methods', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { 
        operation: 'getAvailablePaymentMethods', 
        checkoutId,
      });
      throw error;
    }
  }

  /**
   * Get available shipping rates for checkout
   */
  async getShippingRates(checkoutId: string): Promise<{
    rates: ShippingRate[];
    shopifyRates: any[];
    errors: CheckoutUserError[];
  }> {
    try {
      logger.info('Getting shipping rates', { checkoutId });
      
      const checkout = await this.getCheckout(checkoutId);
      
      if (!checkout) {
        throw new Error('Checkout not found');
      }
      
      if (!checkout.shippingAddress) {
        return {
          rates: [],
          shopifyRates: [],
          errors: [{
            message: 'Shipping address required',
            field: ['shippingAddress'],
          }],
        };
      }
      
      // Calculate total weight (this would come from product data)
      // For now, use a default weight
      const totalWeight = 1; // kg
      
      // Calculate our custom shipping rates
      const customRates = calculateShippingRates(
        (checkout.shippingAddress.countryCodeV2 || 'US') as CountryCode,
        totalWeight,
        checkout.subtotalPriceV2,
        checkout.shippingAddress.zip || undefined
      );
      
      // Get Shopify's available rates
      const shopifyRates = checkout.availableShippingRates?.shippingRates || [];
      
      metrics.increment('checkout.shipping_rates.get', {
        checkoutId,
        customRatesCount: String(customRates.length),
        shopifyRatesCount: String(shopifyRates.length),
      });
      
      return {
        rates: customRates,
        shopifyRates,
        errors: [],
      };
    } catch (error) {
      logger.error('Failed to get shipping rates', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { 
        operation: 'getShippingRates', 
        checkoutId,
      });
      throw error;
    }
  }

  /**
   * Update shipping method on checkout
   */
  async updateShippingMethod(checkoutId: string, shippingRateHandle: string): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    try {
      logger.info('Updating shipping method', { checkoutId, shippingRateHandle });
      
      const response = await this.client.query<{
        checkoutShippingLineUpdate: {
          checkout: Checkout | null;
          checkoutUserErrors: CheckoutUserError[];
        };
      }>(CHECKOUT_SHIPPING_LINE_UPDATE, { checkoutId, shippingRateHandle });
      
      const payload = response.checkoutShippingLineUpdate;
      
      if (payload.checkoutUserErrors.length > 0) {
        logger.warn('Shipping method update had errors', {
          errors: payload.checkoutUserErrors,
          checkoutId,
          shippingRateHandle,
        });
      }
      
      metrics.increment('checkout.shipping_method.update', {
        success: String(!!payload.checkout),
        hasErrors: String(payload.checkoutUserErrors.length > 0),
      });
      
      return {
        checkout: payload.checkout,
        errors: payload.checkoutUserErrors,
      };
    } catch (error) {
      logger.error('Failed to update shipping method', { error, checkoutId, shippingRateHandle });
      captureShopifyError(error instanceof Error ? error.message : String(error), { 
        operation: 'updateShippingMethod', 
        checkoutId,
        shippingRateHandle,
      });
      throw error;
    }
  }

  /**
   * Calculate tax for checkout
   */
  async calculateCheckoutTax(checkoutId: string): Promise<{
    taxCalculation: TaxCalculationResult;
    taxConfiguration: any;
  }> {
    try {
      logger.info('Calculating tax for checkout', { checkoutId });
      
      const checkout = await this.getCheckout(checkoutId);
      
      if (!checkout) {
        throw new Error('Checkout not found');
      }
      
      const countryCode = (checkout.shippingAddress?.countryCodeV2 || 
                         checkout.buyerIdentity?.countryCode || 
                         'US') as CountryCode;
      
      // Get tax configuration for the country
      const taxConfig = getTaxConfiguration(countryCode);
      
      // Calculate tax on the subtotal
      const taxCalc = calculateTax(
        checkout.subtotalPriceV2,
        countryCode
      );
      
      metrics.increment('checkout.tax.calculate', {
        checkoutId,
        countryCode,
        taxRate: String(taxCalc.taxRate),
        taxIncluded: String(taxCalc.pricesIncludeTax),
      });
      
      return {
        taxCalculation: taxCalc,
        taxConfiguration: taxConfig,
      };
    } catch (error) {
      logger.error('Failed to calculate tax', { error, checkoutId });
      captureShopifyError(error instanceof Error ? error.message : String(error), { 
        operation: 'calculateCheckoutTax', 
        checkoutId,
      });
      throw error;
    }
  }

  /**
   * Apply currency code to checkout
   */
  async applyCurrencyCode(checkoutId: string, currencyCode: Currency): Promise<{
    checkout: Checkout | null;
    errors: CheckoutUserError[];
  }> {
    try {
      logger.info('Applying currency code to checkout', { checkoutId, currencyCode });
      
      // For Shopify, we need to recreate the checkout with the new currency
      // Get current checkout
      const currentCheckout = await this.getCheckout(checkoutId);
      
      if (!currentCheckout) {
        throw new Error('Checkout not found');
      }
      
      // Get cart ID from checkout attributes or create new checkout
      const cartId = currentCheckout.customAttributes?.find(
        attr => attr.key === 'cartId'
      )?.value;
      
      if (!cartId) {
        logger.warn('No cart ID found in checkout attributes', { checkoutId });
        return {
          checkout: currentCheckout,
          errors: [],
        };
      }
      
      // Create new checkout with currency
      const result = await this.createCheckout(cartId, {
        email: currentCheckout.email || undefined,
        shippingAddress: currentCheckout.shippingAddress ? {
          address1: currentCheckout.shippingAddress.address1 || undefined,
          address2: currentCheckout.shippingAddress.address2 || undefined,
          city: currentCheckout.shippingAddress.city || undefined,
          company: currentCheckout.shippingAddress.company || undefined,
          country: currentCheckout.shippingAddress.country || undefined,
          firstName: currentCheckout.shippingAddress.firstName || undefined,
          lastName: currentCheckout.shippingAddress.lastName || undefined,
          phone: currentCheckout.shippingAddress.phone || undefined,
          province: currentCheckout.shippingAddress.province || undefined,
          zip: currentCheckout.shippingAddress.zip || undefined,
        } : undefined,
        note: currentCheckout.note || undefined,
        customAttributes: currentCheckout.customAttributes,
        presentmentCurrencyCode: currencyCode as CurrencyCode,
        buyerIdentity: {
          countryCode: currentCheckout.buyerIdentity?.countryCode || undefined,
        },
      });
      
      metrics.increment('checkout.currency.apply', {
        success: String(!!result.checkout),
        currency: currencyCode,
      });
      
      return {
        checkout: result.checkout,
        errors: result.errors,
      };
    } catch (error) {
      logger.error('Failed to apply currency code', { error, checkoutId, currencyCode });
      captureShopifyError(error instanceof Error ? error.message : String(error), { 
        operation: 'applyCurrencyCode', 
        checkoutId,
        currencyCode,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const createCheckoutService = (client: ShopifyClient) => {
  return new ShopifyCheckoutService(client);
};