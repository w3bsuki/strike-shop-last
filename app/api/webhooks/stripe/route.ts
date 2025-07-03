import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyStripeWebhook } from '@/lib/stripe/client';
import { createShopifyOrder } from '@/lib/shopify/orders';
// import { generateOrderReference } from '@/lib/stripe/utils';
import { sendOrderConfirmation } from '@/lib/email/resend';
import { createOrder as createSupabaseOrder } from '@/lib/supabase/orders';
import type { StripeWebhookEvent, ShopifyOrderInput } from '@/lib/stripe/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    // Verify webhook signature
    const event = verifyStripeWebhook(body, signature, endpointSecret);

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event);
        break;
      
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(event: StripeWebhookEvent) {
  const paymentIntent = event.data.object;
  
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  try {
    // Extract order data from metadata
    const metadata = paymentIntent.metadata;
    const orderItems = JSON.parse(metadata.orderItems || '[]');
    // const totals = JSON.parse(metadata.totals || '{}');
    
    // Parse customer information
    const customerEmail = metadata.customer_email || paymentIntent.receipt_email;
    const customerName = metadata.customer_name || '';
    const billingAddress = JSON.parse(metadata.billing_address || '{}');
    const shippingAddress = JSON.parse(metadata.shipping_address || metadata.billing_address || '{}');

    if (!customerEmail || orderItems.length === 0) {
      throw new Error('Missing required order data in payment metadata');
    }

    // Split customer name
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create Shopify order
    const shopifyOrderData: ShopifyOrderInput = {
      email: customerEmail,
      financial_status: 'paid',
      fulfillment_status: 'unfulfilled',
      line_items: orderItems.map((item: any) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.price.toString(),
      })),
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address1: billingAddress.line1 || '',
        address2: billingAddress.line2 || '',
        city: billingAddress.city || '',
        province: billingAddress.state || '',
        zip: billingAddress.postal_code || '',
        country: billingAddress.country || 'US',
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: shippingAddress.line1 || billingAddress.line1 || '',
        address2: shippingAddress.line2 || billingAddress.line2 || '',
        city: shippingAddress.city || billingAddress.city || '',
        province: shippingAddress.state || billingAddress.state || '',
        zip: shippingAddress.postal_code || billingAddress.postal_code || '',
        country: shippingAddress.country || billingAddress.country || 'US',
      },
      tags: 'stripe,headless-checkout',
      note: `Order processed via Stripe. Payment Intent: ${paymentIntent.id}`,
      gateway: 'stripe',
      source_name: 'headless-storefront',
      transactions: [{
        kind: 'sale',
        status: 'success',
        amount: (paymentIntent.amount / 100).toString(),
        currency: paymentIntent.currency.toUpperCase(),
        gateway: 'stripe',
        source_name: 'headless-storefront',
        payment_details: {
          credit_card_number: `•••• •••• •••• ${paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4 || '****'}`,
          credit_card_company: paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand || 'unknown',
        },
      }],
    };

    // Add customer ID if available
    if (metadata.customerId) {
      shopifyOrderData.customer = {
        id: metadata.customerId,
        email: customerEmail,
        first_name: firstName,
        last_name: lastName,
      };
    }

    // Create order in Shopify
    const shopifyOrder = await createShopifyOrder(shopifyOrderData);
    
    console.log(`Shopify order created: ${shopifyOrder.id} for payment ${paymentIntent.id}`);

    // Send order confirmation email
    const emailResult = await sendOrderConfirmation({
      order: shopifyOrder,
      customerEmail: customerEmail,
      customerName: customerName,
      paymentIntentId: paymentIntent.id,
    });

    if (!emailResult.success) {
      console.error(`Failed to send confirmation email for order ${shopifyOrder.id}:`, emailResult.error);
      // Don't throw - email failure shouldn't fail the webhook
    } else {
      console.log(`Confirmation email sent for order ${shopifyOrder.id}, messageId: ${emailResult.messageId}`);
    }

    // Save order to Supabase for faster access
    const supabaseOrder = await createSupabaseOrder({
      stripePaymentIntentId: paymentIntent.id,
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderNumber: shopifyOrder.order_number,
      userId: metadata.customerId || undefined, // This might be a Supabase user ID
      email: customerEmail,
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      currency: paymentIntent.currency,
      items: orderItems,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress,
    });

    if (!supabaseOrder) {
      console.error(`Failed to save order to Supabase for Shopify order ${shopifyOrder.id}`);
      // Don't throw - Supabase failure shouldn't fail the webhook
    } else {
      console.log(`Order saved to Supabase: ${supabaseOrder.id}`);
    }

    // TODO: Update inventory tracking
    // TODO: Trigger fulfillment process

  } catch (error) {
    console.error(`Failed to create Shopify order for payment ${paymentIntent.id}:`, error);
    
    // TODO: Implement retry mechanism
    // TODO: Alert admin of failed order creation
    // TODO: Store failed order data for manual processing
  }
}

async function handlePaymentFailure(event: StripeWebhookEvent) {
  const paymentIntent = event.data.object;
  
  console.log(`Payment failed: ${paymentIntent.id}`);
  console.log(`Failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);

  try {
    // TODO: Send payment failure notification to customer
    // TODO: Update cart status to allow retry
    // TODO: Log payment failure for analytics

  } catch (error) {
    console.error(`Failed to handle payment failure for ${paymentIntent.id}:`, error);
  }
}