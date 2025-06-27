import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

/**
 * Medusa-compatible Stripe webhook endpoint
 * This endpoint handles webhooks from Stripe for the Medusa payment provider
 * Path: /hooks/payment/stripe (standard Medusa webhook path)
 */
export async function POST(req: NextRequest) {
  console.log('🔔 Medusa Stripe webhook received');
  
  try {
    // Get the raw body
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log('✅ Webhook signature verified');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`📦 Processing event: ${event.type} (${event.id})`);

    // Import Medusa SDK for backend operations
    const { medusaApp } = await import('@medusajs/framework');
    const app = await medusaApp({ directory: process.cwd() + '/my-medusa-store' });
    
    // Process the event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event, app);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event, app);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event, app);
        break;
        
      case 'charge.dispute.created':
        await handleChargeDispute(event, app);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, app);
        break;
        
      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true, event_id: event.id });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Return 200 to prevent Stripe from retrying
    // Log the error for investigation
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        event_id: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Return 200 to prevent Stripe retries
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(event: Stripe.Event, app: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  
  try {
    // Get payment module service
    const paymentModuleService = app.modules.payment;
    
    // Find the payment session by Stripe payment intent ID
    const payments = await paymentModuleService.listPayments({
      provider_id: 'stripe',
      data: {
        stripe_payment_intent_id: paymentIntent.id
      }
    });
    
    if (payments.length === 0) {
      console.warn(`⚠️  No payment found for Stripe payment intent: ${paymentIntent.id}`);
      return;
    }
    
    const payment = payments[0];
    
    // Update payment status
    await paymentModuleService.updatePayments(payment.id, {
      status: 'captured',
      captured_at: new Date()
    });
    
    console.log(`✅ Payment ${payment.id} marked as captured`);
    
    // If this payment is associated with an order, complete the order
    if (payment.cart_id) {
      const cartModuleService = app.modules.cart;
      const orderModuleService = app.modules.order;
      
      try {
        // Get the cart
        const cart = await cartModuleService.retrieve(payment.cart_id);
        
        if (cart && !cart.completed_at) {
          // Complete the cart and create an order
          const order = await orderModuleService.createFromCart(cart.id);
          console.log(`✅ Order ${order.id} created from cart ${cart.id}`);
          
          // Mark cart as completed
          await cartModuleService.update(cart.id, {
            completed_at: new Date()
          });
        }
      } catch (orderError) {
        console.error('❌ Error creating order:', orderError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: Stripe.Event, app: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  
  try {
    const paymentModuleService = app.modules.payment;
    
    // Find the payment session
    const payments = await paymentModuleService.listPayments({
      provider_id: 'stripe',
      data: {
        stripe_payment_intent_id: paymentIntent.id
      }
    });
    
    if (payments.length === 0) {
      console.warn(`⚠️  No payment found for Stripe payment intent: ${paymentIntent.id}`);
      return;
    }
    
    const payment = payments[0];
    
    // Update payment status
    await paymentModuleService.updatePayments(payment.id, {
      status: 'failed',
      data: {
        ...payment.data,
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      }
    });
    
    console.log(`✅ Payment ${payment.id} marked as failed`);
    
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(event: Stripe.Event, app: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log(`🚫 Payment canceled: ${paymentIntent.id}`);
  
  try {
    const paymentModuleService = app.modules.payment;
    
    const payments = await paymentModuleService.listPayments({
      provider_id: 'stripe',
      data: {
        stripe_payment_intent_id: paymentIntent.id
      }
    });
    
    if (payments.length === 0) return;
    
    const payment = payments[0];
    
    await paymentModuleService.updatePayments(payment.id, {
      status: 'canceled'
    });
    
    console.log(`✅ Payment ${payment.id} marked as canceled`);
    
  } catch (error) {
    console.error('❌ Error handling payment cancellation:', error);
    throw error;
  }
}

/**
 * Handle charge dispute (chargeback)
 */
async function handleChargeDispute(event: Stripe.Event, app: any) {
  const dispute = event.data.object as Stripe.Dispute;
  
  console.log(`⚠️  Charge dispute created: ${dispute.id}`);
  
  try {
    // Log dispute for manual review
    console.log(`🔍 Dispute details:`, {
      id: dispute.id,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      charge_id: dispute.charge
    });
    
    // TODO: Implement dispute handling workflow
    // - Notify administrators
    // - Update order status
    // - Trigger fraud detection review
    
  } catch (error) {
    console.error('❌ Error handling charge dispute:', error);
    throw error;
  }
}

/**
 * Handle invoice payment succeeded (for subscriptions)
 */
async function handleInvoicePaymentSucceeded(event: Stripe.Event, app: any) {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log(`📄 Invoice payment succeeded: ${invoice.id}`);
  
  try {
    // TODO: Implement subscription payment handling
    // This would be used for recurring payments/subscriptions
    
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
    throw error;
  }
}

/**
 * GET handler for webhook endpoint verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/hooks/payment/stripe',
    description: 'Medusa Stripe payment webhook endpoint'
  });
}