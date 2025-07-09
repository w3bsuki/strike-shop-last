import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: Request) {
  try {
    // Auth check - Data Access Layer pattern
    const user = await requireAuth();
    
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Create order in database
    const supabase = await createClient();
    const items = JSON.parse(paymentIntent.metadata.items || '[]');
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        stripe_payment_intent_id: paymentIntent.id,
        total_amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: 'confirmed',
        items: items,
        metadata: {
          payment_method: paymentIntent.payment_method_types[0],
          receipt_email: paymentIntent.receipt_email,
          email: user.email,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      // Payment succeeded but order creation failed - needs manual intervention
      return NextResponse.json(
        { 
          error: 'Order creation failed', 
          paymentSucceeded: true,
          supportTicketId: `SUPPORT-${Date.now()}` 
        },
        { status: 500 }
      );
    }

    // Clear the user's cart
    const { error: cartError } = await supabase
      .from('carts')
      .update({ items: [], updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (cartError) {
      console.error('Cart clearing error:', cartError);
      // Non-critical error, continue
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: `STRIKE-${order.id.slice(0, 8).toUpperCase()}`,
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}