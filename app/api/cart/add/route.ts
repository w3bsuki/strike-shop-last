import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient, ShopifyCart } from '@/lib/shopify/client';

// Request body type
interface AddToCartRequest {
  cartId: string;
  merchandiseId: string;
  quantity?: number;
}

// Response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/cart/add - Add item to cart
export async function POST(request: NextRequest) {
  try {
    // Check if Shopify client is initialized
    if (!shopifyClient) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Shopify client not configured'
      }, { status: 500 });
    }

    // Parse request body
    const body: AddToCartRequest = await request.json();
    
    // Validate required fields
    if (!body.cartId || !body.merchandiseId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cart ID and merchandise ID are required'
      }, { status: 400 });
    }

    // Validate quantity if provided
    const quantity = body.quantity || 1;
    if (quantity < 1) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Quantity must be at least 1'
      }, { status: 400 });
    }

    // Add item to cart
    const updatedCart = await shopifyClient.addToCart(
      body.cartId,
      body.merchandiseId,
      quantity
    );

    return NextResponse.json<ApiResponse<ShopifyCart>>({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    
    // Check for specific Shopify errors
    if (error instanceof Error) {
      // Handle common Shopify errors
      if (error.message.includes('Cart not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Cart not found. Please create a new cart.'
        }, { status: 404 });
      }
      
      if (error.message.includes('Product variant not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Product variant not found'
        }, { status: 404 });
      }
      
      if (error.message.includes('Not enough inventory')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Not enough inventory available'
        }, { status: 400 });
      }
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to cart'
    }, { status: 500 });
  }
}