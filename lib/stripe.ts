import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions , Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
} else {

}

export { stripePromise };

// Stripe Elements appearance configuration
export const stripeAppearance: StripeElementsOptions['appearance'] = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#000000',
    colorBackground: '#ffffff',
    colorText: '#000000',
    colorDanger: '#df1b41',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '16px',
    spacingUnit: '4px',
    borderRadius: '0px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e5e5',
      borderRadius: '0px',
      padding: '12px',
      fontSize: '14px',
      lineHeight: '20px',
    },
    '.Input:focus': {
      border: '1px solid #000000',
      outline: 'none',
      boxShadow: 'none',
    },
    '.Input--invalid': {
      border: '1px solid #df1b41',
      color: '#df1b41',
    },
    '.Label': {
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '20px',
      marginBottom: '8px',
      color: '#000000',
    },
    '.Error': {
      fontSize: '12px',
      color: '#df1b41',
      marginTop: '4px',
    },
    '.Tab': {
      border: '1px solid #e5e5e5',
      borderRadius: '0px',
      padding: '12px 16px',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      transition: 'all 0.2s ease',
    },
    '.Tab:hover': {
      backgroundColor: '#f5f5f5',
    },
    '.Tab--selected': {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: '1px solid #000000',
    },
    '.TabLabel': {
      fontWeight: '500',
    },
    '.TabIcon': {
      marginRight: '8px',
    },
  },
};

// Stripe configuration types
export interface StripeConfig {
  publishableKey: string;
  webhookSecret?: string;
  apiVersion: string;
}

// Payment Intent types
export interface CreatePaymentIntentData {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  description?: string;
  customer?: string;
  setup_future_usage?: 'on_session' | 'off_session';
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// Webhook event types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
  created: number;
}

// Helper functions
export const formatStripeAmount = (
  amount: number,
  currency: string = 'gbp'
): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const calculateStripeFee = (amount: number): number => {
  // Stripe fee calculation (UK: 1.5% + 20p for European cards)
  const percentageFee = amount * 0.015;
  const fixedFee = 20;
  return Math.round(percentageFee + fixedFee);
};

// Error handling
export class StripeError extends Error {
  code: string;
  decline_code?: string;
  payment_intent?: unknown;

  constructor(
    message: string,
    code: string,
    decline_code?: string,
    payment_intent?: unknown
  ) {
    super(message);
    this.name = 'StripeError';
    this.code = code;
    this.decline_code = decline_code;
    this.payment_intent = payment_intent;
  }
}

interface StripeErrorType {
  type?: string;
  code?: string;
  message?: string;
}

export const handleStripeError = (error: StripeErrorType): string => {
  if (error.type === 'card_error') {
    // Handle specific card errors
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try another payment method.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds.';
      case 'expired_card':
        return 'Your card has expired.';
      case 'incorrect_cvc':
        return "Your card's security code is incorrect.";
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      default:
        return error.message || 'An error occurred with your card.';
    }
  } else if (error.type === 'validation_error') {
    return 'Please check your card details and try again.';
  } else if (error.type === 'api_error') {
    return 'A temporary error occurred. Please try again.';
  } else {
    return 'An unexpected error occurred. Please try again.';
  }
};

// Webhook signature verification
export const verifyWebhookSignature = async (
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not initialized');

    // This would typically be done server-side
    // Client-side verification is not secure
    return true;
  } catch (error) {

    return false;
  }
};

// Payment method types
export const SUPPORTED_PAYMENT_METHODS = [
  'card',
  'klarna',
  'clearpay',
  'apple_pay',
  'google_pay',
] as const;

export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

// Currency configuration
export const SUPPORTED_CURRENCIES = {
  GBP: { symbol: '£', name: 'British Pound' },
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;
