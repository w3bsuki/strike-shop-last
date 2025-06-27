import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logSecurityEvent } from '@/lib/security-config';
import { kv } from '@vercel/kv';
import { PaymentMonitoringService } from '@/lib/security/payment-monitoring';

// Initialize Stripe with secret key
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-05-28.basil' as Stripe.LatestApiVersion,
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Idempotency tracking - store processed events
interface ProcessedEvent {
  id: string;
  type: string;
  processedAt: string;
  result: 'success' | 'failed';
  metadata?: Record<string, any>;
}

// Event store for idempotency (24-hour TTL)
const EVENT_TTL = 24 * 60 * 60; // 24 hours in seconds

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
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') || '';
  
  // Add request ID for tracking
  const requestId = crypto.randomUUID();

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
  } catch (err) {
    logSecurityEvent('Invalid webhook signature', {
      error: err instanceof Error ? err.message : 'Unknown error',
      signature,
      requestId,
    });
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 🔐 IDEMPOTENCY CHECK - Prevent duplicate processing
  const eventKey = `stripe_event:${event.id}`;
  
  try {
    
    try {
      // Check if event was already processed
      const processedEvent = await kv.get<ProcessedEvent>(eventKey);
      
      if (processedEvent) {
        logSecurityEvent('Duplicate webhook event detected', {
          eventId: event.id,
          eventType: event.type,
          previouslyProcessedAt: processedEvent.processedAt,
          requestId,
        });
        
        // Return success to acknowledge receipt (Stripe best practice)
        return NextResponse.json({ 
          received: true, 
          duplicate: true,
          previousResult: processedEvent.result 
        });
      }
    } catch (kvError) {
      // If KV store fails, log but continue processing
      logSecurityEvent('KV store error during idempotency check', {
        error: kvError instanceof Error ? kvError.message : 'Unknown error',
        eventId: event.id,
      });
    }
    
    // Log successful webhook reception
    logSecurityEvent('Stripe webhook received', {
      eventType: event.type,
      eventId: event.id,
      requestId,
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
          await PaymentMonitoringService.logEvent({
            id: paymentIntent.id,
            type: 'payment_intent.succeeded',
            timestamp: new Date().toISOString(),
            ...(paymentIntent.metadata?.userId && { userId: paymentIntent.metadata.userId }),
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            metadata: {
              orderId,
              cartId,
              paymentMethodType: paymentIntent.payment_method_types?.[0],
            },
          });
          
          logSecurityEvent('Payment succeeded', {
            orderId,
            cartId,
            amount: paymentIntent.amount,
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

          // Payment failed - track for monitoring
          await PaymentMonitoringService.logEvent({
            id: failedPayment.id,
            type: 'payment_intent.failed',
            timestamp: new Date().toISOString(),
            ...(failedPayment.metadata?.userId && { userId: failedPayment.metadata.userId }),
            amount: failedPayment.amount,
            currency: failedPayment.currency,
            status: failedPayment.status,
            ...(failedPayment.last_payment_error?.message && { errorMessage: failedPayment.last_payment_error.message }),
            metadata: {
              orderId,
              errorCode: failedPayment.last_payment_error?.code,
              declineCode: failedPayment.last_payment_error?.decline_code,
            },
          });

          // Update order status if applicable
          if (orderId) {
            // await updateOrderStatus(orderId, 'payment_failed')
            logSecurityEvent('Payment failed', {
              orderId,
              errorMessage: failedPayment.last_payment_error?.message,
            });
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
          
          // Track chargeback for monitoring and analysis
          await PaymentMonitoringService.trackChargeback({
            chargeId,
            amount: dispute.amount,
            reason: dispute.reason || 'unknown',
            ...(dispute.metadata?.userId && { userId: dispute.metadata.userId }),
          });
          
          logSecurityEvent('Dispute created - URGENT', {
            chargeId,
            disputeId: dispute.id,
            amount: dispute.amount,
            reason: dispute.reason,
          });
        } catch (_error) {
          // Error handling
          logSecurityEvent('Failed to process dispute webhook', {
            disputeId: dispute.id,
          });
        }
        break;

      case 'charge.refunded':
        const refundedCharge = event.data.object as Stripe.Charge;
        
        await PaymentMonitoringService.logEvent({
          id: refundedCharge.id,
          type: 'charge.refunded',
          timestamp: new Date().toISOString(),
          amount: refundedCharge.amount_refunded,
          currency: refundedCharge.currency,
          metadata: {
            reason: 'partial_refund',
            chargeId: refundedCharge.id,
          },
        });
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        
        // Log new payment method for velocity tracking
        if (paymentMethod.customer) {
          logSecurityEvent('New payment method attached', {
            customerId: paymentMethod.customer,
            type: paymentMethod.type,
            last4: paymentMethod.card?.last4,
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

    // 🔐 STORE SUCCESSFUL PROCESSING - Mark event as processed
    try {
      const processedEvent: ProcessedEvent = {
        id: event.id,
        type: event.type,
        processedAt: new Date().toISOString(),
        result: 'success',
        metadata: {
          requestId,
          livemode: event.livemode,
        },
      };
      
      await kv.setex(eventKey, EVENT_TTL, processedEvent);
      
      logSecurityEvent('Webhook event processed successfully', {
        eventId: event.id,
        eventType: event.type,
        requestId,
      });
    } catch (kvError) {
      // Log KV store error but don't fail the webhook
      logSecurityEvent('Failed to store processed event', {
        error: kvError instanceof Error ? kvError.message : 'Unknown error',
        eventId: event.id,
      });
    }
    
    return NextResponse.json({ received: true, requestId });
  } catch (handlerError) {
    // Error handling
    logSecurityEvent('Webhook handler failed', {
      eventType: event.type,
      error: handlerError instanceof Error ? handlerError.message : 'Unknown error',
      requestId,
    });
    
    // Store failed event for monitoring
    try {
      const eventKey = `stripe_event:${event.id}`;
      const failedEvent: ProcessedEvent = {
        id: event.id,
        type: event.type,
        processedAt: new Date().toISOString(),
        result: 'failed',
        metadata: {
          requestId,
          error: handlerError instanceof Error ? handlerError.message : 'Unknown error',
        },
      };
      
      await kv.setex(eventKey, EVENT_TTL, failedEvent);
    } catch (kvError) {
      // Silent fail for KV store
    }
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripe webhooks require the raw body
export const runtime = 'nodejs';
