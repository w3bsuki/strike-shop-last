/**
 * Cart utilities with market support
 */

import { cookies } from 'next/headers';
// import { getCurrentMarket, getCheckoutUrl } from './markets';  // TODO: markets not implemented
import type { Cart } from './types';

/**
 * Get market-aware checkout URL for a cart
 */
export async function getMarketCheckoutUrl(cart: Cart): Promise<string> {
  // TODO: Implement market-aware checkout URL when markets module is ready
  // const market = await getCurrentMarket();
  // return getCheckoutUrl(cart.checkoutUrl, market);
  return cart.checkoutUrl;
}

/**
 * Format cart prices based on market currency
 */
export function formatCartPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Get cart with market context
 */
export async function getCartWithMarketContext(cartId: string) {
  const cookieStore = await cookies();
  const marketHandle = cookieStore.get('shopify_market')?.value;
  const countryCode = cookieStore.get('shopify_country')?.value;
  
  // Return cart ID with market params if needed
  return {
    cartId,
    marketHandle,
    countryCode,
  };
}