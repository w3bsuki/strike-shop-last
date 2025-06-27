import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/cart/items/[itemId] - Update item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
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

    // Update line item via Medusa API
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${backendUrl}/store/carts/${cartId}/line-items/${itemId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({ quantity }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: response.status }
      );
    }

    const { cart } = await response.json();

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
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const cartId = request.headers.get('x-cart-id');

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    // Delete line item via Medusa API
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${backendUrl}/store/carts/${cartId}/line-items/${itemId}`,
      {
        method: 'DELETE',
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to remove cart item' },
        { status: response.status }
      );
    }

    const { cart } = await response.json();

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error('DELETE /api/cart/items/[itemId] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item' },
      { status: 500 }
    );
  }
}