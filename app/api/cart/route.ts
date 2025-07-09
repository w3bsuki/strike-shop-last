import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient, ShopifyCart } from '@/lib/shopify/client';
import { ApiResponse, createErrorResponse, createSuccessResponse } from './types';

// GET /api/cart - Fetch an existing cart
export async function GET(request: NextRequest) {
  try {
    // Check if Shopify client is initialized
    if (!shopifyClient) {
      const [error, options] = createErrorResponse('Shopify client not configured', 500);
      return NextResponse.json<ApiResponse>(error, options);
    }

    const searchParams = request.nextUrl.searchParams;
    const cartId = searchParams.get('cartId');

    if (!cartId) {
      const [error, options] = createErrorResponse('Cart ID is required', 400);
      return NextResponse.json<ApiResponse>(error, options);
    }

    const cart = await shopifyClient.getCart(cartId);
    
    if (!cart) {
      const [error, options] = createErrorResponse('Cart not found', 404);
      return NextResponse.json<ApiResponse>(error, options);
    }

    return NextResponse.json<ApiResponse<ShopifyCart>>(createSuccessResponse(cart));
  } catch (error) {
    console.error('Error fetching cart:', error);
    const [errorResponse, options] = createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch cart',
      500
    );
    return NextResponse.json<ApiResponse>(errorResponse, options);
  }
}

// POST /api/cart - Create a new cart
export async function POST() {
  try {
    // Check if Shopify client is initialized
    if (!shopifyClient) {
      const [error, options] = createErrorResponse('Shopify client not configured', 500);
      return NextResponse.json<ApiResponse>(error, options);
    }

    const cart = await shopifyClient.createCart();

    return NextResponse.json<ApiResponse<ShopifyCart>>(createSuccessResponse(cart));
  } catch (error) {
    console.error('Error creating cart:', error);
    const [errorResponse, options] = createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create cart',
      500
    );
    return NextResponse.json<ApiResponse>(errorResponse, options);
  }
}