/**
 * Checkout API Route Handlers
 * Handles checkout operations with the new checkout service
 */

import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';
import { createCheckoutService } from '@/lib/shopify/checkout';
import { shopifyCookies } from '@/lib/shopify/cookies';
import { shopifyAuth } from '@/lib/shopify/auth';
import { logger, metrics } from '@/lib/monitoring';

// POST /api/checkout - Create checkout from cart (legacy endpoint)
// This endpoint now redirects to the new /api/checkout/create endpoint
export async function POST(request: NextRequest) {
  logger.info('Legacy checkout endpoint called, redirecting to new endpoint');
  
  // Forward the request to the new endpoint
  const url = new URL('/api/checkout/create', request.url);
  const response = await fetch(url, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  
  return response;
}

// GET /api/checkout - Get checkout status
export async function GET(request: NextRequest) {
  try {
    if (!shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    const checkoutData = await shopifyCookies.checkout.getToken();
    
    if (!checkoutData) {
      return NextResponse.json(
        { error: 'No active checkout' },
        { status: 404 }
      );
    }

    // Get full checkout details using the service
    const checkoutService = createCheckoutService(shopifyClient);
    const checkout = await checkoutService.getCheckout(checkoutData.checkoutId);

    if (!checkout) {
      // Checkout no longer exists, clear the cookie
      await shopifyCookies.checkout.clearToken();
      return NextResponse.json(
        { error: 'Checkout no longer exists' },
        { status: 404 }
      );
    }

    // Check for recoverable cart
    const recoveryCheck = await shopifyAuth.checkRecoverableCart();

    metrics.increment('api.checkout.status', { found: 'true' });

    return NextResponse.json({
      checkout: {
        id: checkout.id,
        webUrl: checkout.webUrl,
        email: checkout.email,
        completedAt: checkout.completedAt,
        totalPrice: checkout.totalPriceV2,
        subtotalPrice: checkout.subtotalPriceV2,
        totalTax: checkout.totalTaxV2,
        requiresShipping: checkout.requiresShipping,
        ready: checkout.ready,
      },
      hasRecoverableCart: recoveryCheck.hasRecoverableCart,
      recoverableCartId: recoveryCheck.cartId,
    });
  } catch (error) {
    logger.error('Checkout status error:', error);
    metrics.increment('api.checkout.status.error');
    
    return NextResponse.json(
      { error: 'Failed to get checkout status' },
      { status: 500 }
    );
  }
}

// PUT /api/checkout - Mark checkout as completed
export async function PUT(request: NextRequest) {
  try {
    if (!shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    const { checkoutId, orderId } = await request.json();

    if (!checkoutId && !orderId) {
      return NextResponse.json(
        { error: 'Checkout ID or Order ID is required' },
        { status: 400 }
      );
    }

    // If checkoutId provided, verify it's completed
    if (checkoutId) {
      const checkoutService = createCheckoutService(shopifyClient);
      const result = await checkoutService.completeCheckout(checkoutId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Checkout is not yet completed' },
          { status: 400 }
        );
      }
    }

    // Clear cart and checkout cookies
    await shopifyCookies.cart.clear();
    await shopifyCookies.checkout.clearToken();
    await shopifyCookies.recovery.clear();

    // Update session activity
    await shopifyCookies.session.updateActivity();

    metrics.increment('api.checkout.complete', { success: 'true' });

    return NextResponse.json({
      success: true,
      orderId: orderId || checkoutId,
    });
  } catch (error) {
    logger.error('Checkout completion error:', error);
    metrics.increment('api.checkout.complete.error');
    
    return NextResponse.json(
      { error: 'Failed to complete checkout' },
      { status: 500 }
    );
  }
}

// PATCH /api/checkout - Update checkout or recover abandoned cart
export async function PATCH(request: NextRequest) {
  try {
    if (!shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { cartId, checkoutId, updates } = body;

    // If recovering a cart
    if (cartId && !checkoutId) {
      const result = await shopifyAuth.recoverCart(cartId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to recover cart' },
          { status: 400 }
        );
      }

      metrics.increment('api.checkout.recover', { success: 'true' });
      
      return NextResponse.json({
        success: true,
        cart: result.cart,
      });
    }

    // If updating a checkout
    if (checkoutId && updates) {
      const checkoutService = createCheckoutService(shopifyClient);
      const result = await checkoutService.updateCheckout(checkoutId, updates);

      if (result.errors.length > 0) {
        logger.warn('Checkout update had errors', { errors: result.errors });
        
        return NextResponse.json(
          { 
            error: 'Failed to update checkout',
            details: result.errors,
          },
          { status: 400 }
        );
      }

      metrics.increment('api.checkout.update', { success: 'true' });

      return NextResponse.json({
        success: true,
        checkout: result.checkout,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide either cartId or checkoutId with updates.' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Checkout operation error:', error);
    metrics.increment('api.checkout.patch.error');
    
    return NextResponse.json(
      { error: 'Failed to process checkout operation' },
      { status: 500 }
    );
  }
}