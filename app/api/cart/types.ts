import type { Cart } from '@/lib/shopify/types';

// Shared API response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// Cart API specific response
export interface CartApiResponse extends ApiResponse<Cart> {}

// Request types
export interface AddToCartRequest {
  cartId: string;
  merchandiseId: string;
  quantity?: number;
}

export interface UpdateCartRequest {
  cartId: string;
  lineId: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  cartId: string;
  lineIds: string[];
}

// Error types
export interface CartError {
  code: string;
  message: string;
  field?: string;
}

// Cart operation types
export type CartOperation = 'create' | 'fetch' | 'add' | 'update' | 'remove';

// Helper function to create consistent error responses
export function createErrorResponse(
  error: string,
  status: number = 500
): [ApiResponse, { status: number }] {
  return [
    {
      success: false,
      error,
      timestamp: new Date().toISOString()
    },
    { status }
  ];
}

// Helper function to create consistent success responses
export function createSuccessResponse<T>(
  data: T
): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}