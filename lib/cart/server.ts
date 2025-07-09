// Server-side cart operations
import { cookies } from 'next/headers';
import type { CartItem } from '@/types/cart';

/**
 * Get cart items from server-side cookie
 */
export async function getCartItems(): Promise<CartItem[]> {
  const cookieStore = await cookies();
  const cartCookie = cookieStore.get('cart');
  
  if (!cartCookie?.value) {
    return [];
  }
  
  try {
    const cartData = JSON.parse(cartCookie.value);
    return cartData.lines || [];
  } catch (error) {
    console.error('Failed to parse cart cookie:', error);
    return [];
  }
}

/**
 * Get cart total from server-side
 */
export async function getCartTotal(): Promise<number> {
  const items = await getCartItems();
  
  return items.reduce((total, item) => {
    return total + (parseFloat(item.merchandise.price.amount) * item.quantity);
  }, 0);
}

/**
 * Get cart count from server-side
 */
export async function getCartCount(): Promise<number> {
  const items = await getCartItems();
  
  return items.reduce((count, item) => count + item.quantity, 0);
}