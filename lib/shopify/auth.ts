/**
 * Shopify Customer Authentication Integration
 * Handles Shopify customer auth and synchronization with Supabase
 */

import { shopifyClient } from './client';
import { shopifyCookies } from './cookies';
import type { Customer, CustomerAccessToken, Cart } from './types';
import { createServerSupabaseClient } from '@/lib/auth/server';

// ============================================
// Customer Authentication
// ============================================

/**
 * Sign in Shopify customer and sync with Supabase
 */
export async function signInShopifyCustomer(
  email: string,
  password: string
): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    // TODO: Implement customerAccessTokenCreate mutation on ShopifyClient
    // This requires adding the mutation to the client class
    throw new Error('Customer authentication not yet implemented');
    
    // The following code needs the customerAccessTokenCreate method to be added to ShopifyClient:
    // const result = await shopifyClient.customerAccessTokenCreate(email, password);
    // ... rest of implementation
  } catch (error) {
    console.error('Shopify sign in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign in failed',
    };
  }
}

/**
 * Sign up new Shopify customer
 */
export async function signUpShopifyCustomer(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    // TODO: Implement customerCreate mutation on ShopifyClient
    throw new Error('Customer registration not yet implemented');
    
    /* const result = await shopifyClient.customerCreate(input);

    if (result.customerUserErrors.length > 0) {
      return {
        success: false,
        error: result.customerUserErrors[0].message,
      };
    }

    if (!result.customer || !result.customerAccessToken) {
      return {
        success: false,
        error: 'Failed to create customer',
      };
    }

    // Store customer token
    await shopifyCookies.customer.setToken(result.customerAccessToken);

    // Sync session with Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await shopifyCookies.session.sync({
        shopifyCustomerId: result.customer.id,
        supabaseUserId: user.id,
      });
    }

    // Migrate anonymous cart to customer
    await shopifyCookies.utils.migrateCart(result.customerAccessToken.accessToken);

    return {
      success: true,
      customer: result.customer,
    }; */
  } catch (error) {
    console.error('Shopify sign up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign up failed',
    };
  }
}

/**
 * Sign out Shopify customer
 */
export async function signOutShopifyCustomer(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    const tokenData = await shopifyCookies.customer.getToken();

    if (tokenData) {
      // Delete access token from Shopify
      // TODO: Implement customerAccessTokenDelete mutation on ShopifyClient
      // await shopifyClient.customerAccessTokenDelete(tokenData.accessToken);
    }

    // Clear all session data
    await shopifyCookies.session.clear();

    return { success: true };
  } catch (error) {
    console.error('Shopify sign out error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    };
  }
}

/**
 * Get current Shopify customer
 */
export async function getCurrentShopifyCustomer(): Promise<Customer | null> {
  if (!shopifyClient) {
    return null;
  }

  try {
    const tokenData = await shopifyCookies.customer.getToken();

    if (!tokenData) {
      return null;
    }

    // Check if token needs refresh
    if (await shopifyCookies.customer.needsRefresh()) {
      const refreshResult = await refreshCustomerToken();
      if (!refreshResult.success) {
        return null;
      }
    }

    // TODO: Implement getCustomer query on ShopifyClient
    return null;
    // return await shopifyClient.getCustomer(tokenData.accessToken);
  } catch (error) {
    console.error('Failed to get current customer:', error);
    return null;
  }
}

/**
 * Refresh customer access token
 */
export async function refreshCustomerToken(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    const tokenData = await shopifyCookies.customer.getToken();

    if (!tokenData) {
      return { success: false, error: 'No token to refresh' };
    }

    // TODO: Implement customerAccessTokenRenew mutation on ShopifyClient
    throw new Error('Token renewal not yet implemented');
    /* // const result = await shopifyClient.customerAccessTokenRenew(tokenData.accessToken);

    if (result.userErrors.length > 0) {
      return {
        success: false,
        error: result.userErrors[0].message,
      };
    }

    if (!result.customerAccessToken) {
      return {
        success: false,
        error: 'Failed to refresh token',
      };
    }

    // Update stored token
    await shopifyCookies.customer.setToken(result.customerAccessToken);

    return { success: true }; */
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * Update Shopify customer details
 */
export async function updateShopifyCustomer(updates: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    const tokenData = await shopifyCookies.customer.getToken();

    if (!tokenData) {
      return { success: false, error: 'Not authenticated' };
    }

    // TODO: Implement customerUpdate mutation on ShopifyClient
    throw new Error('Customer update not yet implemented');
    /* const result = await shopifyClient.customerUpdate(
      tokenData.accessToken,
      updates
    );

    if (result.customerUserErrors.length > 0) {
      return {
        success: false,
        error: result.customerUserErrors[0].message,
      };
    } */

    /* if (!result.customer) {
      return {
        success: false,
        error: 'Failed to update customer',
      };
    }

    // Update token if provided
    if (result.customerAccessToken) {
      await shopifyCookies.customer.setToken(result.customerAccessToken);
    }

    return {
      success: true,
      customer: result.customer,
    }; */
  } catch (error) {
    console.error('Customer update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

/**
 * Request password reset for Shopify customer
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    // TODO: Implement customerRecover mutation on ShopifyClient
    throw new Error('Password recovery not yet implemented');
    /* // const result = await shopifyClient.customerRecover(email);

    if (result.customerUserErrors.length > 0) {
      return {
        success: false,
        error: result.customerUserErrors[0].message,
      };
    }

    return { success: true }; */
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

/**
 * Reset customer password with token
 */
export async function resetPassword(
  customerId: string,
  password: string,
  resetToken: string
): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    // Note: The reset token should be passed as part of the customer ID
    // in the format: gid://shopify/Customer/{id}/{resetToken}
    const resetId = `gid://shopify/Customer/${customerId}/${resetToken}`;
    
    // TODO: Implement customerReset mutation on ShopifyClient
    throw new Error('Password reset not yet implemented');
    /* // const result = await shopifyClient.customerReset(resetId, { password });

    if (result.customerUserErrors.length > 0) {
      return {
        success: false,
        error: result.customerUserErrors[0].message,
      };
    }

    if (!result.customer) {
      return {
        success: false,
        error: 'Failed to reset password',
      };
    }

    // Store new access token if provided
    if (result.customerAccessToken) {
      await shopifyCookies.customer.setToken(result.customerAccessToken);
    }

    return {
      success: true,
      customer: result.customer,
    }; */
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed',
    };
  }
}

// ============================================
// Session Synchronization Helpers
// ============================================

/**
 * Check if user has Shopify customer account
 */
export async function hasShopifyAccount(): Promise<boolean> {
  const customer = await getCurrentShopifyCustomer();
  return !!customer;
}

/**
 * Sync Supabase user with Shopify customer
 */
export async function syncSupabaseWithShopify(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const customer = await getCurrentShopifyCustomer();

    if (customer) {
      await shopifyCookies.session.sync({
        shopifyCustomerId: customer.id,
        supabaseUserId: user.id,
      });
    }
  } catch (error) {
    console.error('Failed to sync Supabase with Shopify:', error);
  }
}

/**
 * Get linked Shopify customer ID for Supabase user
 */
export async function getLinkedShopifyCustomerId(): Promise<string | null> {
  const session = await shopifyCookies.session.get();
  return session?.shopifyCustomerId || null;
}

// ============================================
// Cart Recovery Helpers
// ============================================

/**
 * Check for recoverable cart
 */
export async function checkForRecoverableCart(): Promise<{
  hasRecoverableCart: boolean;
  cartId?: string;
  lastUpdated?: string;
}> {
  const recoveryData = await shopifyCookies.recovery.get();

  if (!recoveryData || recoveryData.recovered) {
    return { hasRecoverableCart: false };
  }

  // Check if cart is older than 1 hour
  const lastUpdated = new Date(recoveryData.lastUpdated);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  if (lastUpdated < oneHourAgo) {
    return {
      hasRecoverableCart: true,
      cartId: recoveryData.cartId,
      lastUpdated: recoveryData.lastUpdated,
    };
  }

  return { hasRecoverableCart: false };
}

/**
 * Recover abandoned cart
 */
export async function recoverCart(cartId: string): Promise<{
  success: boolean;
  cart?: Cart;
  error?: string;
}> {
  if (!shopifyClient) {
    return { success: false, error: 'Shopify client not initialized' };
  }

  try {
    const cart = await shopifyClient.getCart(cartId);

    if (!cart) {
      return {
        success: false,
        error: 'Cart not found',
      };
    }

    // Update cart ID cookie
    await shopifyCookies.cart.setId(cartId);

    // Mark as recovered
    await shopifyCookies.recovery.markRecovered(cartId);

    return {
      success: true,
      cart,
    };
  } catch (error) {
    console.error('Cart recovery error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Recovery failed',
    };
  }
}

// ============================================
// Export unified auth interface
// ============================================

export const shopifyAuth = {
  signIn: signInShopifyCustomer,
  signUp: signUpShopifyCustomer,
  signOut: signOutShopifyCustomer,
  getCurrentCustomer: getCurrentShopifyCustomer,
  updateCustomer: updateShopifyCustomer,
  requestPasswordReset,
  resetPassword,
  refreshToken: refreshCustomerToken,
  hasAccount: hasShopifyAccount,
  syncWithSupabase: syncSupabaseWithShopify,
  getLinkedCustomerId: getLinkedShopifyCustomerId,
  checkRecoverableCart: checkForRecoverableCart,
  recoverCart,
};