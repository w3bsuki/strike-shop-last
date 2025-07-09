/**
 * Shopify Cookie Management System for Strike Shop
 * Handles cart persistence, customer tokens, and session synchronization
 * 
 * Cookie Configuration:
 * - _shopify_cart_id: Persists cart ID across sessions
 * - _shopify_customer_token: Manages customer authentication
 * - _shopify_checkout_token: Tracks active checkout sessions
 * - _shopify_session_id: Links Shopify and Supabase sessions
 */

import { cookies } from 'next/headers';
import { type RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { Cart, CustomerAccessToken } from './types';
import { shopifyClient } from './client';

// Cookie configuration constants
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const;

// Cookie names
export const COOKIE_NAMES = {
  CART_ID: '_shopify_cart_id',
  CUSTOMER_TOKEN: '_shopify_customer_token',
  CHECKOUT_TOKEN: '_shopify_checkout_token',
  SESSION_ID: '_shopify_session_id',
  CART_RECOVERY: '_shopify_cart_recovery',
} as const;

// Cookie expiration times
const EXPIRATION_TIMES = {
  CART: 30 * 24 * 60 * 60 * 1000, // 30 days
  CUSTOMER: 7 * 24 * 60 * 60 * 1000, // 7 days
  CHECKOUT: 24 * 60 * 60 * 1000, // 24 hours
  SESSION: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// ============================================
// Cookie Utilities
// ============================================

/**
 * Set a secure cookie with proper options
 */
async function setCookie(
  name: string,
  value: string,
  maxAge: number = EXPIRATION_TIMES.SESSION
) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    ...COOKIE_OPTIONS,
    maxAge: maxAge / 1000, // Convert to seconds
  });
}

/**
 * Get a cookie value
 */
async function getCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);
  return cookie?.value || null;
}

/**
 * Delete a cookie
 */
async function deleteCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

// ============================================
// Cart Cookie Management
// ============================================

/**
 * Get cart ID from cookie
 */
export async function getCartId(): Promise<string | null> {
  return getCookie(COOKIE_NAMES.CART_ID);
}

/**
 * Set cart ID in cookie
 */
export async function setCartId(cartId: string): Promise<void> {
  await setCookie(COOKIE_NAMES.CART_ID, cartId, EXPIRATION_TIMES.CART);
}

/**
 * Clear cart ID cookie
 */
export async function clearCartId(): Promise<void> {
  await deleteCookie(COOKIE_NAMES.CART_ID);
}

/**
 * Get or create cart with cookie persistence
 */
export async function getOrCreateCart(): Promise<Cart> {
  if (!shopifyClient) {
    throw new Error('Shopify client not initialized');
  }

  // Check for existing cart ID
  const existingCartId = await getCartId();
  
  if (existingCartId) {
    try {
      // Try to retrieve the cart
      const cart = await shopifyClient.getCart(existingCartId);
      
      if (cart) {
        // Update cart recovery timestamp
        await setCartRecovery(existingCartId);
        return cart;
      }
    } catch (error) {
      console.error('Failed to retrieve cart:', error);
      // Cart might be expired or invalid, continue to create new one
    }
  }
  
  // Create new cart
  const newCart = await shopifyClient.createCart();
  await setCartId(newCart.id);
  await setCartRecovery(newCart.id);
  
  return newCart;
}

// ============================================
// Customer Token Management
// ============================================

interface CustomerTokenData {
  accessToken: string;
  expiresAt: string;
  customerId?: string;
}

/**
 * Set customer access token with auto-refresh info
 */
export async function setCustomerToken(tokenData: CustomerAccessToken): Promise<void> {
  const data: CustomerTokenData = {
    accessToken: tokenData.accessToken,
    expiresAt: tokenData.expiresAt,
  };
  
  await setCookie(
    COOKIE_NAMES.CUSTOMER_TOKEN,
    JSON.stringify(data),
    EXPIRATION_TIMES.CUSTOMER
  );
}

/**
 * Get customer access token
 */
export async function getCustomerToken(): Promise<CustomerTokenData | null> {
  const tokenCookie = await getCookie(COOKIE_NAMES.CUSTOMER_TOKEN);
  
  if (!tokenCookie) {
    return null;
  }
  
  try {
    const tokenData = JSON.parse(tokenCookie) as CustomerTokenData;
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expiresAt);
    if (expiresAt <= new Date()) {
      await clearCustomerToken();
      return null;
    }
    
    return tokenData;
  } catch (error) {
    console.error('Failed to parse customer token:', error);
    await clearCustomerToken();
    return null;
  }
}

/**
 * Clear customer token
 */
export async function clearCustomerToken(): Promise<void> {
  await deleteCookie(COOKIE_NAMES.CUSTOMER_TOKEN);
}

/**
 * Check if customer token needs refresh (within 1 hour of expiry)
 */
export async function needsTokenRefresh(): Promise<boolean> {
  const tokenData = await getCustomerToken();
  
  if (!tokenData) {
    return false;
  }
  
  const expiresAt = new Date(tokenData.expiresAt);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  
  return expiresAt <= oneHourFromNow;
}

// ============================================
// Checkout Token Management
// ============================================

interface CheckoutTokenData {
  checkoutId: string;
  checkoutUrl: string;
  createdAt: string;
}

/**
 * Set checkout token for active checkout session
 */
export async function setCheckoutToken(checkoutData: {
  checkoutId: string;
  checkoutUrl: string;
}): Promise<void> {
  const data: CheckoutTokenData = {
    ...checkoutData,
    createdAt: new Date().toISOString(),
  };
  
  await setCookie(
    COOKIE_NAMES.CHECKOUT_TOKEN,
    JSON.stringify(data),
    EXPIRATION_TIMES.CHECKOUT
  );
}

/**
 * Get active checkout token
 */
export async function getCheckoutToken(): Promise<CheckoutTokenData | null> {
  const checkoutCookie = await getCookie(COOKIE_NAMES.CHECKOUT_TOKEN);
  
  if (!checkoutCookie) {
    return null;
  }
  
  try {
    return JSON.parse(checkoutCookie) as CheckoutTokenData;
  } catch (error) {
    console.error('Failed to parse checkout token:', error);
    await clearCheckoutToken();
    return null;
  }
}

/**
 * Clear checkout token
 */
export async function clearCheckoutToken(): Promise<void> {
  await deleteCookie(COOKIE_NAMES.CHECKOUT_TOKEN);
}

// ============================================
// Session Synchronization
// ============================================

interface SessionData {
  shopifyCustomerId?: string;
  supabaseUserId?: string;
  createdAt: string;
  lastActivity: string;
}

/**
 * Create or update session link between Shopify and Supabase
 */
export async function syncSession(data: {
  shopifyCustomerId?: string;
  supabaseUserId?: string;
}): Promise<void> {
  const existingSession = await getSession();
  
  const sessionData: SessionData = {
    shopifyCustomerId: data.shopifyCustomerId || existingSession?.shopifyCustomerId,
    supabaseUserId: data.supabaseUserId || existingSession?.supabaseUserId,
    createdAt: existingSession?.createdAt || new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
  
  await setCookie(
    COOKIE_NAMES.SESSION_ID,
    JSON.stringify(sessionData),
    EXPIRATION_TIMES.SESSION
  );
}

/**
 * Get session data
 */
export async function getSession(): Promise<SessionData | null> {
  const sessionCookie = await getCookie(COOKIE_NAMES.SESSION_ID);
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie) as SessionData;
  } catch (error) {
    console.error('Failed to parse session data:', error);
    return null;
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(): Promise<void> {
  const session = await getSession();
  
  if (session) {
    session.lastActivity = new Date().toISOString();
    await setCookie(
      COOKIE_NAMES.SESSION_ID,
      JSON.stringify(session),
      EXPIRATION_TIMES.SESSION
    );
  }
}

/**
 * Clear all session data
 */
export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteCookie(COOKIE_NAMES.SESSION_ID),
    clearCustomerToken(),
    clearCheckoutToken(),
  ]);
}

// ============================================
// Cart Recovery
// ============================================

interface CartRecoveryData {
  cartId: string;
  lastUpdated: string;
  itemCount?: number;
  totalAmount?: string;
  currencyCode?: string;
  recovered?: boolean;
}

/**
 * Set cart recovery data for abandoned cart recovery
 */
export async function setCartRecovery(
  cartId: string,
  cartData?: {
    itemCount?: number;
    totalAmount?: string;
    currencyCode?: string;
  }
): Promise<void> {
  const recoveryData: CartRecoveryData = {
    cartId,
    lastUpdated: new Date().toISOString(),
    ...cartData,
  };
  
  await setCookie(
    COOKIE_NAMES.CART_RECOVERY,
    JSON.stringify(recoveryData),
    EXPIRATION_TIMES.CART
  );
}

/**
 * Get cart recovery data
 */
export async function getCartRecovery(): Promise<CartRecoveryData | null> {
  const recoveryCookie = await getCookie(COOKIE_NAMES.CART_RECOVERY);
  
  if (!recoveryCookie) {
    return null;
  }
  
  try {
    return JSON.parse(recoveryCookie) as CartRecoveryData;
  } catch (error) {
    console.error('Failed to parse cart recovery data:', error);
    return null;
  }
}

/**
 * Mark cart as recovered
 */
export async function markCartRecovered(cartId: string): Promise<void> {
  const recoveryData = await getCartRecovery();
  
  if (recoveryData && recoveryData.cartId === cartId) {
    recoveryData.recovered = true;
    await setCookie(
      COOKIE_NAMES.CART_RECOVERY,
      JSON.stringify(recoveryData),
      EXPIRATION_TIMES.CART
    );
  }
}

/**
 * Clear cart recovery data
 */
export async function clearCartRecovery(): Promise<void> {
  await deleteCookie(COOKIE_NAMES.CART_RECOVERY);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get all Shopify-related cookies
 */
export async function getAllShopifyCookies(): Promise<Record<string, RequestCookie>> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const shopifyCookies: Record<string, RequestCookie> = {};
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('_shopify_')) {
      shopifyCookies[cookie.name] = cookie;
    }
  }
  
  return shopifyCookies;
}

/**
 * Clear all Shopify-related cookies
 */
export async function clearAllShopifyCookies(): Promise<void> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('_shopify_')) {
      cookieStore.delete(cookie.name);
    }
  }
}

/**
 * Migrate cart from anonymous to authenticated user
 */
export async function migrateCartToCustomer(customerAccessToken: string): Promise<void> {
  const cartId = await getCartId();
  
  if (!cartId || !shopifyClient) {
    return;
  }
  
  try {
    // Update cart with customer info
    const updatedCart = await shopifyClient.query(
      `
        mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
          cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
            cart {
              id
              checkoutUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        cartId,
        buyerIdentity: {
          customerAccessToken,
        },
      }
    );
    
    console.log('Cart migrated to customer successfully');
  } catch (error) {
    console.error('Failed to migrate cart to customer:', error);
  }
}

// ============================================
// Export Cookie Management Interface
// ============================================

export const shopifyCookies = {
  // Cart management
  cart: {
    getId: getCartId,
    setId: setCartId,
    clear: clearCartId,
    getOrCreate: getOrCreateCart,
  },
  
  // Customer management
  customer: {
    getToken: getCustomerToken,
    setToken: setCustomerToken,
    clearToken: clearCustomerToken,
    needsRefresh: needsTokenRefresh,
  },
  
  // Checkout management
  checkout: {
    getToken: getCheckoutToken,
    setToken: setCheckoutToken,
    clearToken: clearCheckoutToken,
  },
  
  // Session management
  session: {
    sync: syncSession,
    get: getSession,
    updateActivity: updateSessionActivity,
    clear: clearSession,
  },
  
  // Cart recovery
  recovery: {
    set: setCartRecovery,
    get: getCartRecovery,
    markRecovered: markCartRecovered,
    clear: clearCartRecovery,
  },
  
  // Utilities
  utils: {
    getAll: getAllShopifyCookies,
    clearAll: clearAllShopifyCookies,
    migrateCart: migrateCartToCustomer,
  },
};