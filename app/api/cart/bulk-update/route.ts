import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';

interface BulkUpdateRequest {
  cartId: string;
  updates: Array<{
    lineItemId: string;
    quantity: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { cartId, updates }: BulkUpdateRequest = await request.json();

    if (!cartId || !updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Cart ID and updates array are required' },
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'At least one update is required' },
        { status: 400 }
      );
    }

    // Validate updates structure
    for (const update of updates) {
      if (!update.lineItemId || typeof update.quantity !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have lineItemId and quantity' },
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

    // Process updates in batches to avoid rate limiting
    const maxUpdatesPerRequest = 10;
    const batches = [];
    
    for (let i = 0; i < updates.length; i += maxUpdatesPerRequest) {
      batches.push(updates.slice(i, i + maxUpdatesPerRequest));
    }

    let updatedCart;
    
    // Process each batch
    for (const batch of batches) {
      // Separate removals from updates
      const removals = batch.filter(update => update.quantity === 0);
      const quantityUpdates = batch.filter(update => update.quantity > 0);
      
      // Handle removals
      if (removals.length > 0) {
        const lineIdsToRemove = removals.map(update => update.lineItemId);
        updatedCart = await shopifyClient.removeFromCart(cartId, lineIdsToRemove);
      }
      
      // Handle quantity updates
      for (const update of quantityUpdates) {
        updatedCart = await shopifyClient.updateCartLines(
          cartId, 
          update.lineItemId, 
          update.quantity
        );
      }
    }

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      message: `Successfully updated ${updates.length} items`,
    });

  } catch (error) {
    console.error('Bulk update cart error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update cart items',
        success: false 
      },
      { status: 500 }
    );
  }
}