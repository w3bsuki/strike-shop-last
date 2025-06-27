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

// GET /api/cart - Get current cart
export async function GET(request: NextRequest) {
  try {
    const cartId = request.headers.get('x-cart-id');
    const cart = await getOrCreateCart(cartId);
    
    return NextResponse.json({ cart }, {
      headers: {
        'x-cart-id': cart.id,
      },
    });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Create new cart
export async function POST() {
  try {
    const cart = await getOrCreateCart();
    
    return NextResponse.json({ cart }, {
      headers: {
        'x-cart-id': cart.id,
      },
    });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json(
      { error: 'Failed to create cart' },
      { status: 500 }
    );
  }
}