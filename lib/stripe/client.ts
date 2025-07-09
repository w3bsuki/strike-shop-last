// Stripe Client Configuration
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key is not configured');
    }

    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Stripe server-side client
import StripeSDK from 'stripe';

let stripeServerInstance: StripeSDK | null = null;

export const getStripeServer = (): StripeSDK => {
  if (!stripeServerInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    stripeServerInstance = new StripeSDK(secretKey, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });
  }
  
  return stripeServerInstance;
};

// Verify webhook signature
export const verifyStripeWebhook = (
  payload: string | Buffer,
  signature: string,
  endpointSecret: string
): StripeSDK.Event => {
  const stripe = getStripeServer();
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
};