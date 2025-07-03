import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe/client';
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
    const body = await request.json();
    const { cartItems, shippingAddress, customerId } = body;

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
    const amount = dollarsToCents(totals.total);

    // Validate minimum amount (Stripe requires $0.50 minimum)
    if (amount < 50) {
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
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
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

  } catch (error) {
    console.error('Payment Intent creation error:', error);
    
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