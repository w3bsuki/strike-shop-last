import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';

interface BulkAddItem {
  productId: string;
  variantId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

interface BulkAddRequest {
  cartId: string;
  items: BulkAddItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { cartId, items }: BulkAddRequest = await request.json();

    if (!cartId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Cart ID and items array are required' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.variantId || !item.quantity || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have variantId and quantity' },
          { status: 400 }
        );
      }
    }

    if (!shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    // Convert to Shopify format
    const shopifyItems = items.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity,
      attributes: item.attributes || [],
    }));

    // Shopify has a limit on the number of items per request
    const maxItemsPerRequest = 10;
    const batches = [];
    
    for (let i = 0; i < shopifyItems.length; i += maxItemsPerRequest) {
      batches.push(shopifyItems.slice(i, i + maxItemsPerRequest));
    }

    // Process batches sequentially to avoid rate limiting
    let updatedCart;
    for (const batch of batches) {
      // Add items one by one as Shopify doesn't have bulk add
      for (const item of batch) {
        updatedCart = await shopifyClient.addToCart(cartId, item.merchandiseId, item.quantity);
      }
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: `Successfully added ${items.length} items to cart`,
    });

  } catch (error) {
    console.error('Bulk add to cart error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to add items to cart',
        success: false 
      },
      { status: 500 }
    );
  }
}