import { NextRequest, NextResponse } from 'next/server';
import { medusaClient } from '@/lib/medusa';

// PATCH /api/cart/items/[itemId] - Update item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const cartId = request.headers.get('x-cart-id');
    const body = await request.json();
    const { quantity } = body;

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // Update line item
    const { cart } = await medusaClient.carts.lineItems.update(
      cartId,
      params.itemId,
      { quantity }
    );

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error('PATCH /api/cart/items/[itemId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const cartId = request.headers.get('x-cart-id');

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    // Delete line item
    const { cart } = await medusaClient.carts.lineItems.delete(
      cartId,
      params.itemId
    );

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error('DELETE /api/cart/items/[itemId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item' },
      { status: 500 }
    );
  }
}