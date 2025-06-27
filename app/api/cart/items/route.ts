import { NextRequest, NextResponse } from 'next/server';
import { medusaClient } from '@/lib/medusa';

// Helper to get or create cart
async function getOrCreateCart(cartId?: string | null) {
  try {
    // If cartId exists, try to retrieve it
    if (cartId) {
      try {
        const { cart } = await medusaClient.carts.retrieve(cartId);
        if (cart) return cart;
      } catch (error) {
        console.log('Cart not found, creating new one');
      }
    }

    // Create new cart
    const { cart } = await medusaClient.carts.create({
      region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || 'reg_01J0PY5V5W92D5H5YZH52XNNPQ',
    });
    
    return cart;
  } catch (error) {
    console.error('Error in getOrCreateCart:', error);
    throw error;
  }
}

// POST /api/cart/items - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const cartId = request.headers.get('x-cart-id');
    const body = await request.json();
    
    const { variantId, quantity = 1 } = body;
    
    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Get or create cart
    const cart = await getOrCreateCart(cartId);

    // Add line item
    const { cart: updatedCart } = await medusaClient.carts.lineItems.create(cart.id, {
      variant_id: variantId,
      quantity,
    });

    return NextResponse.json({ cart: updatedCart }, {
      headers: {
        'x-cart-id': updatedCart.id,
      },
    });
  } catch (error: any) {
    console.error('POST /api/cart/items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}