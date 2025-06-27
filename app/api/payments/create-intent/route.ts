import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { medusaClient } from '@/lib/medusa-service-refactored';
import { validateCSRF } from '@/lib/csrf-protection';
import { logSecurityEvent, sanitizeLogData } from '@/lib/security-config';

// Initialize Stripe with secret key
const stripeKey = process.env['STRIPE_SECRET_KEY'] || '';
const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil' as Stripe.LatestApiVersion,
    })
  : null;

// Rate limiting for payment intent creation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // Maximum payment intents per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `payment_${ip}`;
  const current = rateLimitMap.get(key) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  if (now > current.resetTime) {
    current.count = 1;
    current.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    current.count++;
  }

  rateLimitMap.set(key, current);
  return current.count <= RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    // Security validations
    if (!stripe) {
      logSecurityEvent('Stripe not configured', { path: req.nextUrl.pathname });
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 503 }
      );
    }

    // Validate CSRF token
    try {
      await validateCSRF(req);
    } catch (error) {
      logSecurityEvent('CSRF validation failed', {
        path: req.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anonymous',
      });
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 403 }
      );
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      logSecurityEvent('Payment rate limit exceeded', { ip: clientIP });
      return NextResponse.json(
        { error: 'Too many payment requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate request body
    let cartId: string;
    try {
      const body = await req.json();
      cartId = body.cartId;
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!cartId || typeof cartId !== 'string' || cartId.length > 50) {
      return NextResponse.json(
        { error: 'Valid cart ID is required' },
        { status: 400 }
      );
    }

    // Get cart from Medusa
    const cartResponse = await medusaClient.store.cart.retrieve(cartId);
    const cart = cartResponse.cart;

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Validate cart has items and total
    if (!cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate total amount in pence
    const amount = Math.round(cart.total || 0);

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid cart total' },
        { status: 400 }
      );
    }

    // Security: Limit maximum payment amount
    const maxAmount = 50000000; // £500,000 in pence
    if (amount > maxAmount) {
      logSecurityEvent('Excessive payment amount requested', {
        amount,
        cartId,
        ip: clientIP,
      });
      return NextResponse.json(
        { error: 'Payment amount exceeds limit' },
        { status: 400 }
      );
    }

    // Create payment intent with additional security metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: cart.region?.currency_code?.toLowerCase() || 'gbp',
      metadata: {
        cart_id: cartId,
        medusa_region_id: cart.region_id || '',
        client_ip: clientIP,
        created_at: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Strike™ Order - Cart ${cartId}`,
      statement_descriptor: 'STRIKE SHOP',
    });

    // Log successful payment intent creation (without sensitive data)
    logSecurityEvent('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount,
      currency: paymentIntent.currency,
      cartId: sanitizeLogData(cartId),
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logSecurityEvent('Payment intent creation failed', {
      error: sanitizeLogData(errorMessage),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anonymous',
    });

    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details:
          process.env.NODE_ENV === 'development'
            ? errorMessage
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Explicitly disable other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
