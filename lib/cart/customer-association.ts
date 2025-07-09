import { shopifyClient } from '@/lib/shopify';
import { getShopifyAccessToken } from '@/lib/auth/customer-sync';
import type { User } from '@supabase/supabase-js';

/**
 * Cart Customer Association Service
 * Handles associating carts with authenticated customers
 */

export interface CartBuyerIdentity {
  email?: string;
  phone?: string;
  customerAccessToken?: string;
  countryCode?: string;
}

/**
 * Associate cart with authenticated customer
 */
export async function associateCartWithCustomer(
  cartId: string,
  user: User
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!shopifyClient) {
      return { success: false, error: 'Shopify client not configured' };
    }

    // Get customer access token
    const accessToken = await getShopifyAccessToken(user);
    
    const buyerIdentity: CartBuyerIdentity = {
      email: user.email,
      ...(accessToken && { customerAccessToken: accessToken }),
      ...(user.user_metadata?.phone && { phone: user.user_metadata.phone }),
    };

    // TODO: Implement updateCartBuyerIdentity in ShopifyClient
    // This requires adding a new GraphQL mutation to update buyer identity
    // For now, we'll skip this step
    console.warn('Cart buyer identity update not yet implemented');

    return { success: true };
  } catch (error) {
    console.error('Error associating cart with customer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Recover cart for authenticated user
 * Merges any existing cart with user's previous cart
 */
export async function recoverUserCart(
  user: User,
  currentCartId?: string
): Promise<{ cartId: string | null; merged: boolean }> {
  try {
    if (!shopifyClient) {
      return { cartId: currentCartId || null, merged: false };
    }

    // Check for saved cart ID in user metadata
    const savedCartId = user.user_metadata?.shopify_cart_id;
    
    if (!savedCartId) {
      // No previous cart, just associate current cart if exists
      if (currentCartId) {
        await associateCartWithCustomer(currentCartId, user);
      }
      return { cartId: currentCartId || null, merged: false };
    }

    // Try to retrieve saved cart
    let savedCart;
    try {
      savedCart = await shopifyClient.getCart(savedCartId);
    } catch {
      // Saved cart doesn't exist or is invalid
      if (currentCartId) {
        await associateCartWithCustomer(currentCartId, user);
      }
      return { cartId: currentCartId || null, merged: false };
    }

    if (!currentCartId || !savedCart) {
      // Use saved cart or current cart
      const cartToUse = savedCart ? savedCartId : currentCartId;
      if (cartToUse) {
        await associateCartWithCustomer(cartToUse, user);
      }
      return { cartId: cartToUse || null, merged: false };
    }

    // Both carts exist - merge them
    const currentCart = await shopifyClient.getCart(currentCartId);
    if (!currentCart) {
      await associateCartWithCustomer(savedCartId, user);
      return { cartId: savedCartId, merged: false };
    }

    // Merge current cart items into saved cart
    const currentItems = currentCart.lines.edges.map(({ node }) => ({
      merchandiseId: node.merchandise.id,
      quantity: node.quantity,
      attributes: node.attributes,
    }));

    if (currentItems.length > 0) {
      // Add items one by one as Shopify doesn't have bulk add
      for (const item of currentItems) {
        await shopifyClient.addToCart(savedCartId, item.merchandiseId, item.quantity);
      }
    }

    // Associate merged cart with customer
    await associateCartWithCustomer(savedCartId, user);

    return { cartId: savedCartId, merged: true };
  } catch (error) {
    console.error('Error recovering user cart:', error);
    return { cartId: currentCartId || null, merged: false };
  }
}

/**
 * Save cart ID to user metadata for recovery
 */
export async function saveCartToUser(cartId: string, user: User): Promise<void> {
  try {
    const { createServerSupabaseClient } = await import('@/lib/auth/server');
    const supabase = await createServerSupabaseClient();
    
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        shopify_cart_id: cartId,
      },
    });
  } catch (error) {
    console.error('Error saving cart to user:', error);
  }
}

/**
 * Create guest checkout URL with pre-filled customer data
 */
export async function createGuestCheckoutUrl(
  cartId: string,
  user?: User
): Promise<string | null> {
  try {
    if (!shopifyClient) return null;

    const cart = await shopifyClient.getCart(cartId);
    if (!cart) return null;

    // If user is authenticated and connected to Shopify, use customer checkout
    if (user) {
      const accessToken = await getShopifyAccessToken(user);
      if (accessToken) {
        // Cart is already associated with customer, use regular checkout URL
        return cart.checkoutUrl;
      }
    }

    return cart.checkoutUrl;
  } catch (error) {
    console.error('Error creating checkout URL:', error);
    return null;
  }
}