/**
 * Shopify Middleware Utilities
 * Handles token refresh and session management
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { shopifyCookies } from './cookies';
import { shopifyAuth } from './auth';

/**
 * Refresh Shopify customer token if needed
 * This should be called in middleware or at the start of protected routes
 */
export async function refreshShopifyTokenIfNeeded(): Promise<boolean> {
  try {
    // Check if token needs refresh
    const needsRefresh = await shopifyCookies.customer.needsRefresh();
    
    if (needsRefresh) {
      const result = await shopifyAuth.refreshToken();
      return result.success;
    }
    
    return true;
  } catch (error) {
    console.error('Token refresh check failed:', error);
    return false;
  }
}

/**
 * Middleware to handle Shopify session management
 * Add this to your Next.js middleware.ts file for protected routes
 */
export async function shopifyMiddleware(request: NextRequest) {
  // List of paths that require Shopify authentication
  const protectedPaths = [
    '/account',
    '/orders',
    '/addresses',
    '/wishlist',
  ];
  
  const path = request.nextUrl.pathname;
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));
  
  if (isProtectedPath) {
    // Check if user has Shopify customer token
    const tokenData = await shopifyCookies.customer.getToken();
    
    if (!tokenData) {
      // Redirect to sign in
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(signInUrl);
    }
    
    // Try to refresh token if needed
    const refreshed = await refreshShopifyTokenIfNeeded();
    
    if (!refreshed) {
      // Token refresh failed, redirect to sign in
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectTo', path);
      signInUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Update session activity
  await shopifyCookies.session.updateActivity();
  
  return NextResponse.next();
}

/**
 * Check for abandoned cart on page load
 * This can be called in layout or page components
 */
export async function checkAbandonedCart(): Promise<{
  hasAbandonedCart: boolean;
  cartId?: string;
  message?: string;
}> {
  try {
    const recoveryCheck = await shopifyAuth.checkRecoverableCart();
    
    if (recoveryCheck.hasRecoverableCart) {
      return {
        hasAbandonedCart: true,
        cartId: recoveryCheck.cartId,
        message: 'You have items in your cart from your last visit. Would you like to continue shopping?',
      };
    }
    
    return { hasAbandonedCart: false };
  } catch (error) {
    console.error('Abandoned cart check failed:', error);
    return { hasAbandonedCart: false };
  }
}

/**
 * Sync Shopify and Supabase sessions
 * Call this after successful authentication
 */
export async function syncAuthSessions(supabaseUserId?: string): Promise<void> {
  try {
    const customer = await shopifyAuth.getCurrentCustomer();
    
    if (customer && supabaseUserId) {
      await shopifyCookies.session.sync({
        shopifyCustomerId: customer.id,
        supabaseUserId,
      });
    }
  } catch (error) {
    console.error('Session sync failed:', error);
  }
}

/**
 * Clear all Shopify sessions
 * Call this on logout
 */
export async function clearShopifySessions(): Promise<void> {
  try {
    // Sign out from Shopify
    await shopifyAuth.signOut();
    
    // Clear all cookies
    await shopifyCookies.utils.clearAll();
  } catch (error) {
    console.error('Failed to clear Shopify sessions:', error);
  }
}

/**
 * Get Shopify session info for debugging
 */
export async function getShopifySessionInfo(): Promise<{
  hasCart: boolean;
  hasCustomer: boolean;
  hasCheckout: boolean;
  sessionData: any;
}> {
  try {
    const cartId = await shopifyCookies.cart.getId();
    const customerToken = await shopifyCookies.customer.getToken();
    const checkoutToken = await shopifyCookies.checkout.getToken();
    const sessionData = await shopifyCookies.session.get();
    
    return {
      hasCart: !!cartId,
      hasCustomer: !!customerToken,
      hasCheckout: !!checkoutToken,
      sessionData,
    };
  } catch (error) {
    console.error('Failed to get session info:', error);
    return {
      hasCart: false,
      hasCustomer: false,
      hasCheckout: false,
      sessionData: null,
    };
  }
}