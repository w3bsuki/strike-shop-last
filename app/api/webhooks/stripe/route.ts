import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyStripeWebhook } from '@/lib/stripe/client';
import { createShopifyOrder } from '@/lib/shopify/orders';
// import { generateOrderReference } from '@/lib/stripe/utils';
import { sendOrderConfirmation, sendPaymentFailureNotification } from '@/lib/email/resend';
import { createOrder as createSupabaseOrder, updateOrderStatus } from '@/lib/supabase/orders';
import { createClient } from '@/lib/supabase/server';
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
    
    // Store failed order in Supabase for retry
    try {
      const supabase = await createClient();
      
      // Store failed order data in a retry queue
      const { data: failedOrder } = await supabase
        .from('order_retry_queue')
        .insert({
          stripe_payment_intent_id: paymentIntent.id,
          order_data: {
            metadata: paymentIntent.metadata,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            receipt_email: paymentIntent.receipt_email,
          },
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: 0,
          max_retries: 3,
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 minutes
        })
        .select()
        .single();
      
      if (failedOrder) {
        console.log(`Queued failed order for retry: ${failedOrder.id}`);
      }
      
      // Alert admin via email
      await sendOrderConfirmation({
        order: {
          id: `FAILED-${paymentIntent.id}`,
          order_number: 0,
          name: `#FAILED-${Date.now()}`,
          total_price: (paymentIntent.amount / 100).toString(),
          financial_status: 'paid',
          fulfillment_status: 'unfulfilled',
          created_at: new Date().toISOString(),
          currency: paymentIntent.currency.toUpperCase(),
          customer: {
            email: paymentIntent.receipt_email || paymentIntent.metadata.customer_email || 'admin@strike.com',
          },
        },
        customerEmail: 'admin@strike.com',
        customerName: 'Admin',
        paymentIntentId: paymentIntent.id,
        subject: '⚠️ URGENT: Shopify Order Creation Failed',
        isAdminAlert: true,
      });
      
    } catch (retryError) {
      console.error('Failed to queue order for retry:', retryError);
    }
  }
}

async function handlePaymentFailure(event: StripeWebhookEvent) {
  const paymentIntent = event.data.object;
  
  console.log(`Payment failed: ${paymentIntent.id}`);
  console.log(`Failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);

  try {
    // Extract customer email
    const customerEmail = paymentIntent.receipt_email || 
                         paymentIntent.metadata?.customer_email || 
                         paymentIntent.charges?.data[0]?.billing_details?.email;
    
    if (customerEmail) {
      // Send payment failure notification to customer
      const emailResult = await sendPaymentFailureNotification({
        customerEmail,
        customerName: paymentIntent.metadata?.customer_name || 'Customer',
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment could not be processed',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
      });
      
      if (!emailResult.success) {
        console.error(`Failed to send payment failure email: ${emailResult.error}`);
      } else {
        console.log(`Payment failure notification sent to ${customerEmail}`);
      }
    }
    
    // Update order status if it exists in Supabase
    const supabase = await createClient();
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();
    
    if (existingOrder) {
      await updateOrderStatus(existingOrder.id, 'payment_failed', {
        failure_reason: paymentIntent.last_payment_error?.message,
        failed_at: new Date().toISOString(),
      });
      console.log(`Updated order ${existingOrder.id} status to payment_failed`);
    }
    
    // Log payment failure for analytics
    await supabase
      .from('payment_failures')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        failure_reason: paymentIntent.last_payment_error?.message,
        failure_code: paymentIntent.last_payment_error?.code,
        customer_email: customerEmail,
        metadata: paymentIntent.metadata,
      });

  } catch (error) {
    console.error(`Failed to handle payment failure for ${paymentIntent.id}:`, error);
  }
}