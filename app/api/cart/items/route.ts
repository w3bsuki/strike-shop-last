import { NextRequest, NextResponse } from 'next/server';

// Helper to get or create cart
async function getOrCreateCart(cartId?: string | null) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!backendUrl) {
      throw new Error('Backend URL not configured');
    }

    // If cartId exists, try to retrieve it
    if (cartId) {
      try {
        const response = await fetch(`${backendUrl}/store/carts/${cartId}`, {
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        });
        if (response.ok) {
          const { cart } = await response.json();
          return cart;
        }
      } catch (error) {
        console.log('Cart not found, creating new one');
      }
    }

    // Create new cart
    const createResponse = await fetch(`${backendUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
      body: JSON.stringify({
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || 'reg_01J0PY5V5W92D5H5YZH52XNNPQ',
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create cart');
    }

    const { cart } = await createResponse.json();
    
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
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendUrl}/store/carts/${cart.id}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
      body: JSON.stringify({
        variant_id: variantId,
        quantity,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to add item to cart' },
        { status: response.status }
      );
    }

    const { cart: updatedCart } = await response.json();

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