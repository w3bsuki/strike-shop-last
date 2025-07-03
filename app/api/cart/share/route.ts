import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient } from '@/lib/shopify/client';
import { createHash, randomBytes } from 'crypto';

interface ShareCartRequest {
  cartId: string;
  expiryHours?: number;
}

interface SharedCart {
  shareToken: string;
  cartId: string;
  cartData: any;
  expiryTimestamp: number;
  createdAt: number;
}

// In-memory storage for shared carts (in production, use Redis or database)
const sharedCarts = new Map<string, SharedCart>();

// Cleanup expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of sharedCarts.entries()) {
    if (data.expiryTimestamp < now) {
      sharedCarts.delete(token);
    }
  }
}, 60 * 60 * 1000); // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { cartId, expiryHours = 24 }: ShareCartRequest = await request.json();

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    if (!shopifyClient) {
      return NextResponse.json(
        { error: 'Shopify client not initialized' },
        { status: 500 }
      );
    }

    // Get current cart data
    const cart = await shopifyClient.getCart(cartId);
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Generate secure share token
    const shareToken = generateShareToken(cartId);
    const expiryTimestamp = Date.now() + (expiryHours * 60 * 60 * 1000);

    // Store shared cart data
    const sharedCartData: SharedCart = {
      shareToken,
      cartId,
      cartData: cart,
      expiryTimestamp,
      createdAt: Date.now(),
    };

    sharedCarts.set(shareToken, sharedCartData);

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/cart/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      expiryTimestamp,
      expiresIn: `${expiryHours} hours`,
      itemCount: cart.lines.edges.length,
    });

  } catch (error) {
    console.error('Share cart error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create shareable cart',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve shared cart
export async function GET(request: NextRequest) {
  try {
    const shareToken = request.nextUrl.searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    const sharedCart = sharedCarts.get(shareToken);

    if (!sharedCart) {
      return NextResponse.json(
        { error: 'Shared cart not found or expired' },
        { status: 404 }
      );
    }

    // Check if expired
    if (sharedCart.expiryTimestamp < Date.now()) {
      sharedCarts.delete(shareToken);
      return NextResponse.json(
        { error: 'Shared cart has expired' },
        { status: 410 } // Gone
      );
    }

    return NextResponse.json({
      success: true,
      cart: sharedCart.cartData,
      createdAt: sharedCart.createdAt,
      expiryTimestamp: sharedCart.expiryTimestamp,
    });

  } catch (error) {
    console.error('Get shared cart error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to retrieve shared cart',
        success: false 
      },
      { status: 500 }
    );
  }
}

function generateShareToken(cartId: string): string {
  // Create a secure, URL-safe token
  const randomPart = randomBytes(16).toString('hex');
  const cartHash = createHash('sha256').update(cartId).digest('hex').substring(0, 8);
  const timestamp = Date.now().toString(36);
  
  return `${randomPart}-${cartHash}-${timestamp}`;
}