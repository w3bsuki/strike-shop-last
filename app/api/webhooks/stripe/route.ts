import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logSecurityEvent } from '@/lib/security-config';

// Initialize Stripe with secret key
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-05-28.basil' as Stripe.LatestApiVersion,
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Security validation for webhook endpoints
function validateWebhookSecurity(signature: string, _body: string): boolean {
  if (!webhookSecret) {
    logSecurityEvent('Stripe webhook secret not configured');
    return false;
  }

  if (!signature) {
    logSecurityEvent('Stripe webhook signature missing');
    return false;
  }

  return true;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') || '';

  // Check if Stripe is configured
  if (!stripe) {
    logSecurityEvent('Stripe not configured for webhook');
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 503 }
    );
  }

  // Security validation
  if (!validateWebhookSecurity(signature, body)) {
    return NextResponse.json(
      { error: 'Webhook security validation failed' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Log successful webhook reception
    logSecurityEvent('Stripe webhook received', {
      eventType: event.type,
      eventId: event.id,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logSecurityEvent('Stripe webhook signature verification failed', {
      error: errorMessage,
      signature: signature ? '[PRESENT]' : '[MISSING]',
    });

    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        try {
          // Extract order information from metadata
          const orderId = paymentIntent.metadata?.order_id;
          const cartId = paymentIntent.metadata?.cart_id;

          if (!orderId && !cartId) {

            break;
          }

          // Update order status in Medusa
          if (orderId) {
            // This would typically call your Medusa admin API
            // await updateOrderStatus(orderId, 'paid')

          }

          // Send confirmation email
          // await sendOrderConfirmationEmail(paymentIntent.receipt_email, orderId)

          // Payment processed successfully
          logSecurityEvent('Payment succeeded', {
            orderId,
            cartId,
          });
        } catch (_error) {
          // Log error but don't throw - we still want to acknowledge receipt of webhook
          logSecurityEvent('Failed to process successful payment webhook', {
            orderId: paymentIntent.metadata?.order_id,
            cartId: paymentIntent.metadata?.cart_id,
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;

        try {
          const orderId = failedPayment.metadata?.order_id;
          // const _cartId = failedPayment.metadata?.cart_id;

          // Payment failed

          // Update order status if applicable
          if (orderId) {
            // await updateOrderStatus(orderId, 'payment_failed')

          }

          // Could send failure notification email here
          // await sendPaymentFailureEmail(failedPayment.receipt_email, orderId)
        } catch (_error) {
          // Error handling
          logSecurityEvent('Failed to process payment failure webhook', {
            orderId: failedPayment.metadata?.order_id,
            cartId: failedPayment.metadata?.cart_id,
          });
        }
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;

        try {
          // Extract payment intent ID from charge
          const chargeId = dispute.charge as string;

          // Payment dispute created - requires admin attention

          // In production, you would:
          // 1. Send urgent notification to admin team
          // 2. Flag the order for review
          // 3. Pause any pending fulfillment
          // 4. Start gathering evidence for dispute response

          // await notifyAdminOfDispute(dispute)
          // await pauseOrderFulfillment(chargeId)
          
          logSecurityEvent('Dispute created', {
            chargeId,
            disputeId: dispute.id,
          });
        } catch (_error) {
          // Error handling
          logSecurityEvent('Failed to process dispute webhook', {
            disputeId: dispute.id,
          });
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription events if you add subscriptions later
        break;

      default:
        // Unhandled event type
        logSecurityEvent('Unhandled webhook event type', {
          eventType: event.type,
        });
    }

    return NextResponse.json({ received: true });
  } catch (_error) {
    // Error handling
    logSecurityEvent('Webhook handler failed', {
      eventType: event.type,
    });
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripe webhooks require the raw body
export const runtime = 'nodejs';
