/**
 * Checkout Creation API Route
 * Creates a Shopify checkout from cart data
 */

import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';
import { createCheckoutService } from '@/lib/shopify/checkout';
import { shopifyCookies } from '@/lib/shopify/cookies';
import { shopifyAuth } from '@/lib/shopify/auth';
import { logger, metrics } from '@/lib/monitoring';
import { checkRateLimit } from '@/lib/rate-limiting';
import type { CheckoutCreateOptions } from '@/lib/shopify/types/checkout';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check rate limit
    const rateLimitResponse = await checkRateLimit(request, 'checkout');
    if (rateLimitResponse) return rateLimitResponse;

    if (!shopifyClient) {
      logger.error('Shopify client not initialized');
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      email,
      shippingAddress,
      note,
      customAttributes,
      locale = 'en',
    } = body;

    // Get cart ID from cookies
    const cartId = await shopifyCookies.cart.getId();
    if (!cartId) {
      return NextResponse.json(
        { error: 'No cart found. Please add items to your cart first.' },
        { status: 404 }
      );
    }

    logger.info('Creating checkout from cart', { cartId, locale, hasEmail: !!email });

    // Initialize checkout service
    const checkoutService = createCheckoutService(shopifyClient);

    // Check if user is authenticated
    const customer = await shopifyAuth.getCurrentCustomer();
    const customerAccessToken = customer ? await shopifyCookies.customer.getToken() : null;

    // Prepare checkout options
    const checkoutOptions: CheckoutCreateOptions = {
      email: email || customer?.email,
      shippingAddress,
      note,
      customAttributes,
    };

    // Add locale context
    if (locale) {
      const languageMap: Record<string, string> = {
        en: 'EN',
        bg: 'BG',
        ua: 'UK', // Ukrainian uses UK code
      };
      
      // Note: BGN currency might need to be added to CurrencyCode enum if using TypeScript strict mode
      // Note: BG, UA country codes might need to be added to CountryCode enum if using TypeScript strict mode
    }

    // Create checkout
    const result = await checkoutService.createCheckout(cartId, checkoutOptions);

    if (!result.checkout) {
      logger.error('Failed to create checkout', { errors: result.errors });
      
      // Return user-friendly error messages
      const errorMessage = result.errors.length > 0 
        ? result.errors.map(e => e.message).join(', ')
        : 'Failed to create checkout. Please try again.';
        
      return NextResponse.json(
        { error: errorMessage, details: result.errors },
        { status: 400 }
      );
    }

    // Associate customer if authenticated
    if (customerAccessToken?.accessToken && result.checkout) {
      try {
        const associateResult = await checkoutService.associateCustomerWithCheckout(
          result.checkout.id,
          customerAccessToken.accessToken
        );
        
        if (associateResult.checkout) {
          result.checkout = associateResult.checkout;
        }
        
        if (associateResult.errors.length > 0) {
          logger.warn('Customer association had warnings', { 
            errors: associateResult.errors,
          });
        }
      } catch (error) {
        // Log but don't fail the checkout creation
        logger.error('Failed to associate customer with checkout', { error });
      }
    }

    // Store checkout information in cookies
    await shopifyCookies.checkout.setToken({
      checkoutId: result.checkout.id,
      checkoutUrl: result.checkout.webUrl,
    });

    // Track metrics
    const duration = Date.now() - startTime;
    metrics.increment('api.checkout.create', { success: 'true' });
    metrics.timing('api.checkout.create.duration', duration);

    logger.info('Checkout created successfully', {
      checkoutId: result.checkout.id,
      totalPrice: result.checkout.totalPriceV2,
      hasCustomer: !!customer,
    });

    // Return checkout information
    return NextResponse.json({
      success: true,
      checkout: {
        id: result.checkout.id,
        webUrl: result.checkout.webUrl,
        totalPrice: result.checkout.totalPriceV2,
        subtotalPrice: result.checkout.subtotalPriceV2,
        totalTax: result.checkout.totalTaxV2,
        requiresShipping: result.checkout.requiresShipping,
        email: result.checkout.email,
        lineItemCount: result.checkout.lineItems.edges.length,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Checkout creation failed', { 
      error,
      duration,
    });
    
    metrics.increment('api.checkout.create', { success: 'false' });
    metrics.timing('api.checkout.create.duration', duration);

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while creating checkout. Please try again.',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}