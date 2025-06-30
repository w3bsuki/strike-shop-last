import { ShopifyCart } from '@/lib/shopify/client';
import { 
  ApiResponse,
  AddToCartRequest,
  UpdateCartRequest,
  RemoveFromCartRequest 
} from '@/app/api/cart/types';

// Cart API client for frontend use
export class CartApiClient {
  private baseUrl = '/api/cart';

  // Helper method for API calls
  private async fetchApi<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  // Create a new cart
  async createCart(): Promise<ApiResponse<ShopifyCart>> {
    return this.fetchApi<ShopifyCart>('', {
      method: 'POST',
    });
  }

  // Fetch an existing cart
  async getCart(cartId: string): Promise<ApiResponse<ShopifyCart>> {
    return this.fetchApi<ShopifyCart>(`?cartId=${encodeURIComponent(cartId)}`);
  }

  // Add item to cart
  async addToCart(
    cartId: string,
    merchandiseId: string,
    quantity: number = 1
  ): Promise<ApiResponse<ShopifyCart>> {
    const body: AddToCartRequest = {
      cartId,
      merchandiseId,
      quantity,
    };

    return this.fetchApi<ShopifyCart>('/add', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Update item quantity in cart
  async updateCart(
    cartId: string,
    lineId: string,
    quantity: number
  ): Promise<ApiResponse<ShopifyCart>> {
    const body: UpdateCartRequest = {
      cartId,
      lineId,
      quantity,
    };

    return this.fetchApi<ShopifyCart>('/update', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Remove items from cart
  async removeFromCart(
    cartId: string,
    lineIds: string[]
  ): Promise<ApiResponse<ShopifyCart>> {
    const body: RemoveFromCartRequest = {
      cartId,
      lineIds,
    };

    return this.fetchApi<ShopifyCart>('/remove', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Remove single item from cart (alternative method)
  async removeSingleItem(
    cartId: string,
    lineId: string
  ): Promise<ApiResponse<ShopifyCart>> {
    return this.fetchApi<ShopifyCart>(
      `/remove?cartId=${encodeURIComponent(cartId)}&lineId=${encodeURIComponent(lineId)}`,
      {
        method: 'DELETE',
      }
    );
  }
}

// Export singleton instance
export const cartApi = new CartApiClient();

// Helper functions for cart operations

/**
 * Get or create a cart
 * Tries to get an existing cart from localStorage, creates a new one if not found
 */
export async function getOrCreateCart(): Promise<ShopifyCart | null> {
  const cartId = localStorage.getItem('cartId');
  
  if (cartId) {
    const response = await cartApi.getCart(cartId);
    if (response.success && response.data) {
      return response.data;
    }
  }
  
  // Create new cart
  const createResponse = await cartApi.createCart();
  if (createResponse.success && createResponse.data) {
    localStorage.setItem('cartId', createResponse.data.id);
    return createResponse.data;
  }
  
  return null;
}

/**
 * Clear cart from localStorage
 */
export function clearStoredCart(): void {
  localStorage.removeItem('cartId');
}

/**
 * Get stored cart ID
 */
export function getStoredCartId(): string | null {
  return localStorage.getItem('cartId');
}

/**
 * Store cart ID
 */
export function storeCartId(cartId: string): void {
  localStorage.setItem('cartId', cartId);
}