import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const instance = getStripe();
    return Reflect.get(instance, prop, receiver);
  },
});

// Helper function to create payment intent
export async function createPaymentIntent({
  amount,
  currency = 'gbp',
  metadata = {},
  customerEmail,
  description,
}: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
  description?: string;
}) {
  try {
    const amountInCents = Math.round(amount * 100); // Convert to pence/cents
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: {
        ...metadata,
        // Add security tracking
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Enable Klarna and other BNPL options
      payment_method_types: ['card', 'klarna'],
      
      // 🔐 3D SECURE ENFORCEMENT
      payment_method_options: {
        card: {
          // Require 3DS for high-value transactions (£100+)
          request_three_d_secure: amountInCents >= 10000 ? 'required' : 'automatic',
          // Capture method - manual for fraud review on high amounts
          capture_method: amountInCents >= 50000 ? 'manual' : 'automatic',
        },
      },
      
      // 🔴 FRAUD DETECTION - Stripe Radar settings
      radar_options: {
        // Skip rules for test mode only
        skip_rules: process.env.NODE_ENV === 'development' ? ['all'] : [],
      },
      
      // Additional fraud prevention
      receipt_email: customerEmail,
      description: description || `Payment for order ${metadata.order_id || 'N/A'}`,
      
      // Statement descriptor for clear billing
      statement_descriptor_suffix: 'STRIKESHOP',
    });

    return paymentIntent;
  } catch (error) {
    console.error('🚨 Payment Intent Creation Failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// Helper function to confirm payment intent
export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {

    throw error;
  }
}

// Helper function to create customer
export async function createCustomer({
  email,
  name,
  metadata = {},
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error) {

    throw error;
  }
}

// Helper function to create ephemeral key for mobile payments
export async function createEphemeralKey(customerId: string) {
  try {
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-12-18.acacia' }
    );

    return ephemeralKey;
  } catch (error) {

    throw error;
  }
}

// Helper function to handle webhooks
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {

    throw error;
  }
}