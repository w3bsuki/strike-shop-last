import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

// Get or initialize Stripe
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Stripe publishable key is not configured');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  apiVersion: '2023-10-16' as const,
  
  // Appearance configuration for Elements
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#000000',
      colorDanger: '#ef4444',
      fontFamily: "'Courier Prime', 'Courier New', monospace",
      fontSizeBase: '16px',
      spacingUnit: '4px',
      borderRadius: '0px',
    },
    rules: {
      '.Input': {
        border: '1px solid #e5e7eb',
        borderRadius: '0px',
        padding: '12px',
        fontSize: '14px',
        lineHeight: '20px',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
      },
      '.Input:focus': {
        border: '1px solid #000000',
        outline: 'none',
        boxShadow: 'none',
      },
      '.Input--invalid': {
        border: '1px solid #ef4444',
        color: '#ef4444',
      },
      '.Label': {
        fontSize: '12px',
        fontWeight: '700',
        lineHeight: '16px',
        marginBottom: '8px',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
      },
      '.Error': {
        fontSize: '12px',
        color: '#ef4444',
        marginTop: '4px',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
      },
      '.Tab': {
        border: '1px solid #e5e7eb',
        borderRadius: '0px',
        padding: '12px 16px',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        transition: 'all 0.2s ease',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
      },
      '.Tab:hover': {
        backgroundColor: '#f9fafb',
        borderColor: '#000000',
      },
      '.Tab--selected': {
        backgroundColor: '#000000',
        color: '#ffffff',
        border: '1px solid #000000',
      },
      '.TabLabel': {
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
      },
      '.TabIcon': {
        marginRight: '8px',
      },
    },
  },
  
  // Payment method configuration
  paymentMethods: {
    card: {
      enabled: true,
      label: 'Card',
      icon: 'CreditCard',
    },
    klarna: {
      enabled: true,
      label: 'Klarna',
      icon: 'Receipt',
    },
    clearpay: {
      enabled: true,
      label: 'Clearpay',
      icon: 'Calendar',
    },
    applePay: {
      enabled: true,
      label: 'Apple Pay',
      icon: 'Smartphone',
    },
    googlePay: {
      enabled: true,
      label: 'Google Pay',
      icon: 'Smartphone',
    },
  },
};

// Stripe Elements options
export const getStripeElementsOptions = (clientSecret: string) => ({
  clientSecret,
  appearance: stripeConfig.appearance,
  loader: 'auto' as const,
});

// Format amount for display
export const formatAmount = (amount: number, currency: string = 'gbp'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Calculate processing fee
export const calculateProcessingFee = (amount: number): number => {
  // UK Stripe fees: 1.5% + 20p for European cards
  const percentageFee = amount * 0.015;
  const fixedFee = 20;
  return Math.round(percentageFee + fixedFee);
};

// Payment intent metadata
export const createPaymentMetadata = (data: {
  orderId: string;
  customerId?: string;
  cartItems: number;
  source: string;
}) => {
  return {
    order_id: data.orderId,
    customer_id: data.customerId || 'guest',
    cart_items: data.cartItems.toString(),
    source: data.source,
    timestamp: new Date().toISOString(),
  };
};

// Error messages
export const getStripeErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred';
  
  // Handle Stripe specific errors
  if (error.type === 'card_error' || error.type === 'validation_error') {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try another payment method.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect.';
      case 'expired_card':
        return 'Your card has expired.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'incorrect_number':
        return 'Your card number is incorrect.';
      default:
        return error.message || 'Your card was declined.';
    }
  }
  
  // Handle network errors
  if (error.type === 'api_connection_error') {
    return 'Connection error. Please check your internet and try again.';
  }
  
  // Handle rate limit errors
  if (error.type === 'rate_limit_error') {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Default error message
  return error.message || 'Payment failed. Please try again.';
};