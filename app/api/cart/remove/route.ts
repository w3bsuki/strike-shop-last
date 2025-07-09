import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient, ShopifyCart } from '@/lib/shopify/client';

// Request body type
interface RemoveFromCartRequest {
  cartId: string;
  lineIds: string[];
}

// Response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/cart/remove - Remove items from cart
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
    const body: RemoveFromCartRequest = await request.json();
    
    // Validate required fields
    if (!body.cartId || !body.lineIds || !Array.isArray(body.lineIds)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cart ID and line IDs array are required'
      }, { status: 400 });
    }

    // Validate line IDs array
    if (body.lineIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'At least one line ID must be provided'
      }, { status: 400 });
    }

    // Validate each line ID
    const invalidLineIds = body.lineIds.filter(id => !id || typeof id !== 'string');
    if (invalidLineIds.length > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'All line IDs must be valid strings'
      }, { status: 400 });
    }

    // Remove items from cart
    const updatedCart = await shopifyClient.removeFromCart(body.cartId, body.lineIds);

    return NextResponse.json<ApiResponse<ShopifyCart>>({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    
    // Check for specific Shopify errors
    if (error instanceof Error) {
      if (error.message.includes('Cart not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Cart not found'
        }, { status: 404 });
      }
      
      if (error.message.includes('Line item not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'One or more line items not found in cart'
        }, { status: 404 });
      }
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove items from cart'
    }, { status: 500 });
  }
}

// DELETE /api/cart/remove - Alternative method for removing a single item
export async function DELETE(request: NextRequest) {
  try {
    // Check if Shopify client is initialized
    if (!shopifyClient) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Shopify client not configured'
      }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cartId = searchParams.get('cartId');
    const lineId = searchParams.get('lineId');

    if (!cartId || !lineId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cart ID and line ID are required'
      }, { status: 400 });
    }

    // Remove single item from cart
    const updatedCart = await shopifyClient.removeFromCart(cartId, [lineId]);

    return NextResponse.json<ApiResponse<ShopifyCart>>({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    
    // Check for specific Shopify errors
    if (error instanceof Error) {
      if (error.message.includes('Cart not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Cart not found'
        }, { status: 404 });
      }
      
      if (error.message.includes('Line item not found')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Line item not found in cart'
        }, { status: 404 });
      }
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item from cart'
    }, { status: 500 });
  }
}