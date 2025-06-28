import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe-server';
import { validateCSRF } from '@/lib/csrf-protection';
import { logSecurityEvent, sanitizeLogData } from '@/lib/security-config';
import { createClient } from '@/lib/supabase/server';

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

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      logSecurityEvent('Payment rate limit exceeded', { ip: clientIP, userId: user.id });
      return NextResponse.json(
        { error: 'Too many payment requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    let body: {
      amount: number;
      currency?: string;
      items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        size?: string;
      }>;
      shipping?: {
        name: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          postal_code: string;
          country: string;
        };
      };
    };

    try {
      body = await req.json();
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate amount
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Convert amount to pence (Stripe expects smallest currency unit)
    const amountInPence = Math.round(body.amount * 100);

    // Security: Limit maximum payment amount
    const maxAmount = 50000000; // £500,000 in pence
    if (amountInPence > maxAmount) {
      logSecurityEvent('Excessive payment amount requested', {
        amount: amountInPence,
        userId: user.id,
        ip: clientIP,
      });
      return NextResponse.json(
        { error: 'Payment amount exceeds limit' },
        { status: 400 }
      );
    }

    // Create payment intent with security metadata
    const paymentIntent = await createPaymentIntent({
      amount: body.amount, // createPaymentIntent will handle conversion
      currency: body.currency || 'gbp',
      ...(user.email && { customerEmail: user.email }),
      description: `Strike™ Order - ${body.items?.length || 0} items`,
      metadata: {
        userId: user.id,
        itemCount: (body.items?.length || 0).toString(),
        client_ip: clientIP,
        created_at: new Date().toISOString(),
      },
    });

    // Log successful payment intent creation (without sensitive data)
    logSecurityEvent('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount: amountInPence,
      currency: paymentIntent.currency,
      userId: sanitizeLogData(user.id),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
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

// Handle GET requests for retrieving payment intent status
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const paymentIntentId = searchParams.get('payment_intent_id');

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: 'Payment intent ID is required' },
      { status: 400 }
    );
  }

  try {
    // Validate CSRF for GET requests too
    await validateCSRF(req);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Import stripe from stripe-server
    const { stripe } = await import('@/lib/stripe-server');
    
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify the payment intent belongs to this user
    if (paymentIntent.metadata.userId !== user.id) {
      logSecurityEvent('Unauthorized payment intent access attempt', {
        paymentIntentId,
        userId: user.id,
        actualUserId: paymentIntent.metadata.userId,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to retrieve payment intent',
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
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}