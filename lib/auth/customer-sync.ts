import { createServerSupabaseClient } from '@/lib/auth/server';
import { shopifyClient, createCustomerService } from '@/lib/shopify';
import type { User } from '@supabase/supabase-js';
import type { CustomerAccessToken } from '@/lib/shopify/types/customer';

/**
 * Customer Sync Service
 * Synchronizes Supabase authentication with Shopify Customer API
 */

interface CustomerSyncResult {
  success: boolean;
  shopifyCustomerId?: string;
  shopifyAccessToken?: CustomerAccessToken;
  error?: string;
}

/**
 * Create or sync a Shopify customer when a user signs up
 */
export async function createShopifyCustomer(
  user: User,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<CustomerSyncResult> {
  try {
    if (!shopifyClient) {
      return { success: false, error: 'Shopify client not configured' };
    }

    const customerService = createCustomerService(shopifyClient);

    // Create customer in Shopify
    const result = await customerService.createCustomer({
      email: user.email!,
      password,
      firstName,
      lastName,
      acceptsMarketing: false, // Can be updated based on user preference
    });

    if (result.customerUserErrors.length > 0) {
      // Check if customer already exists
      const existingError = result.customerUserErrors.find(
        error => error.code === 'CUSTOMER_DISABLED' || error.message.includes('already exists')
      );

      if (existingError) {
        // Try to login instead
        return await loginShopifyCustomer(user.email!, password);
      }

      return {
        success: false,
        error: result.customerUserErrors[0]?.message || 'Failed to create customer',
      };
    }

    if (!result.customer || !result.customerAccessToken) {
      return { success: false, error: 'Failed to create customer' };
    }

    // Store Shopify customer ID in Supabase user metadata
    const supabase = await createServerSupabaseClient();
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        shopify_customer_id: result.customer.id,
      },
    });

    return {
      success: true,
      shopifyCustomerId: result.customer.id,
      shopifyAccessToken: result.customerAccessToken,
    };
  } catch (error) {
    console.error('Error creating Shopify customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Login to Shopify when a user signs in
 */
export async function loginShopifyCustomer(
  email: string,
  password: string
): Promise<CustomerSyncResult> {
  try {
    if (!shopifyClient) {
      return { success: false, error: 'Shopify client not configured' };
    }

    const customerService = createCustomerService(shopifyClient);

    // Login to Shopify
    const result = await customerService.login({
      email,
      password,
    });

    if (result.customerUserErrors.length > 0) {
      return {
        success: false,
        error: result.customerUserErrors[0]?.message || 'Login failed',
      };
    }

    if (!result.customerAccessToken) {
      return { success: false, error: 'Failed to login' };
    }

    // Get customer details to store the ID
    const customer = await customerService.getCustomer(result.customerAccessToken.accessToken);

    if (!customer) {
      return { success: false, error: 'Failed to get customer details' };
    }

    return {
      success: true,
      shopifyCustomerId: customer.id,
      shopifyAccessToken: result.customerAccessToken,
    };
  } catch (error) {
    console.error('Error logging in Shopify customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get or create Shopify access token for a user
 */
export async function getShopifyAccessToken(user: User): Promise<string | null> {
  try {
    // Check app metadata for stored token
    const shopifyToken = user.app_metadata?.shopify_access_token;
    const tokenExpires = user.app_metadata?.shopify_token_expires;

    if (shopifyToken && tokenExpires) {
      // Check if token is still valid
      const expiresAt = new Date(tokenExpires);
      const now = new Date();
      
      // Refresh if token expires within 1 hour
      if (expiresAt.getTime() - now.getTime() > 3600000) {
        return shopifyToken;
      } else {
        // Try to renew the token
        const renewedToken = await renewShopifyAccessToken(shopifyToken);
        if (renewedToken) {
          await storeShopifyAccessToken(user.id, renewedToken);
          return renewedToken.accessToken;
        }
      }
    }

    // If no token, user needs to re-authenticate with Shopify
    return null;
  } catch (error) {
    console.error('Error getting Shopify access token:', error);
    return null;
  }
}

/**
 * Renew Shopify access token before expiry
 */
export async function renewShopifyAccessToken(
  currentToken: string
): Promise<CustomerAccessToken | null> {
  try {
    if (!shopifyClient) return null;

    const customerService = createCustomerService(shopifyClient);
    return await customerService.renewAccessToken(currentToken);
  } catch (error) {
    console.error('Error renewing Shopify access token:', error);
    return null;
  }
}

/**
 * Store Shopify access token in secure session
 */
export async function storeShopifyAccessToken(
  userId: string,
  accessToken: CustomerAccessToken
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Store in secure server-side session
    // Note: In production, consider using a secure token storage solution
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        shopify_access_token: accessToken.accessToken,
        shopify_token_expires: accessToken.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error storing Shopify access token:', error);
  }
}

/**
 * Sync customer data between Supabase and Shopify
 */
export async function syncCustomerData(user: User): Promise<void> {
  try {
    if (!shopifyClient) return;

    const customerService = createCustomerService(shopifyClient);
    const shopifyCustomerId = user.user_metadata?.shopify_customer_id;

    if (!shopifyCustomerId) {
      console.log('No Shopify customer ID found for user');
      return;
    }

    // Get Shopify access token
    const accessToken = await getShopifyAccessToken(user);
    if (!accessToken) {
      console.log('No Shopify access token available');
      return;
    }

    // Get customer data from Shopify
    const customer = await customerService.getCustomer(accessToken);
    if (!customer) {
      console.log('Customer not found in Shopify');
      return;
    }

    // Update Supabase user metadata with latest Shopify data
    const supabase = await createServerSupabaseClient();
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        shopify_customer_id: customer.id,
        first_name: customer.firstName || user.user_metadata?.first_name,
        last_name: customer.lastName || user.user_metadata?.last_name,
        phone: customer.phone || user.user_metadata?.phone,
      },
    });
  } catch (error) {
    console.error('Error syncing customer data:', error);
  }
}

/**
 * Handle customer logout
 */
export async function logoutShopifyCustomer(accessToken: string): Promise<void> {
  try {
    if (!shopifyClient) return;

    const customerService = createCustomerService(shopifyClient);
    await customerService.logout(accessToken);
  } catch (error) {
    console.error('Error logging out Shopify customer:', error);
  }
}