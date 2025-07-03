import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuth } from '@/lib/auth/server';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
  try {
    // Auth check - using Data Access Layer pattern (CVE-2025-29927 compliant)
    const user = await requireAuth();
    
    const body = await request.json();
    const { amount, currency = 'gbp', items } = body;

    // Validate request
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents/pence
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        items: JSON.stringify(items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          size: item.size,
        }))),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    // Handle Stripe errors specifically
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Handle auth errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}