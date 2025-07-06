import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe/client';
import { requireAuth } from '@/lib/auth/server';
import { 
  cartToOrderItems, 
  calculateOrderTotals, 
  dollarsToCents,
  validateCheckoutForm,
  calculateShippingCost,
  getTaxRate
} from '@/lib/stripe/utils';
import type { PaymentIntentRequest } from '@/lib/stripe/types';

export async function POST(request: NextRequest) {
  try {
    // Auth check - using Data Access Layer pattern (CVE-2025-29927 compliant)
    const user = await requireAuth();
    
    const body = await request.json();
    const { amount, currency = 'gbp', items, cartItems, shippingAddress, customerId } = body;

    // Handle simple payment intent (legacy create-payment-intent format)
    if (amount && items && !cartItems) {
      // Validate request
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Invalid amount' },
          { status: 400 }
        );
      }

      // Create payment intent with Stripe
      const stripe = getStripeServer();
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
    }

    // Handle comprehensive payment intent (create-intent format)
    if (cartItems) {
      // Validate input
      if (!cartItems || cartItems.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        );
      }

      // Convert cart items to order items
      const orderItems = cartToOrderItems(cartItems);

      // Calculate shipping and tax
      const shippingCost = shippingAddress 
        ? calculateShippingCost(shippingAddress)
        : 0;
      
      const taxRate = shippingAddress 
        ? getTaxRate(shippingAddress)
        : 0;

      // Calculate totals
      const totals = calculateOrderTotals(orderItems, shippingCost, taxRate);
      
      // Convert to Stripe cents
      const amountInCents = dollarsToCents(totals.total);

      // Validate minimum amount (Stripe requires $0.50 minimum)
      if (amountInCents < 50) {
        return NextResponse.json(
          { error: 'Order total must be at least $0.50' },
          { status: 400 }
        );
      }

      // Create Payment Intent
      const stripe = getStripeServer();
      
      // Prepare metadata for webhook processing
      // Note: Stripe metadata values must be strings and have a 500 character limit per value
      // Create slimmed down order items for metadata (exclude images to stay under limit)
      const orderItemsForMetadata = orderItems.map(item => ({
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        title: item.title.substring(0, 50) // Truncate title to save space
      }));
      
      const paymentIntentData: PaymentIntentRequest = {
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: user.id,
          cartId: `cart_${Date.now()}`,
          customerId: customerId || undefined,
          // Store order items as JSON string (required for Shopify order creation)
          orderItems: JSON.stringify(orderItemsForMetadata),
          // Store totals for order processing
          totals: JSON.stringify(totals),
        },
      };

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totals.total,
        totals,
      });
    }

    // Invalid request format
    return NextResponse.json(
      { error: 'Invalid request format. Provide either amount+items or cartItems.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    // Handle Stripe errors specifically
    if (error && typeof error === 'object' && 'type' in error) {
      return NextResponse.json(
        { error: (error as any).message },
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

// Confirm payment intent
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, checkoutData } = body;

    // Validate checkout form data
    const validation = validateCheckoutForm(checkoutData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid checkout data', details: validation.errors },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    
    // Get existing payment intent to preserve metadata
    const existingIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Update payment intent with customer information
    // Merge metadata to preserve orderItems and totals
    await stripe.paymentIntents.update(paymentIntentId, {
      receipt_email: checkoutData.email,
      metadata: {
        ...existingIntent.metadata,
        customer_email: checkoutData.email,
        customer_name: checkoutData.fullName,
        billing_address: JSON.stringify(checkoutData.address),
        shipping_address: JSON.stringify(checkoutData.shipping || checkoutData.address),
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Payment Intent update error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}

// Get payment intent details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });

  } catch (error) {
    console.error('Payment intent retrieval error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve payment intent' },
      { status: 500 }
    );
  }
}