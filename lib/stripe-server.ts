import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Helper function to create payment intent
export async function createPaymentIntent({
  amount,
  currency = 'gbp',
  metadata = {},
}: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence/cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      // Enable Klarna and other BNPL options
      payment_method_types: ['card', 'klarna'],
    });

    return paymentIntent;
  } catch (error) {

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