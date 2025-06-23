import type { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {

      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Stripe configuration
export const stripeConfig = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#000000',
      colorDanger: '#df1b41',
      fontFamily: '"Typewriter", "Courier Prime", ui-monospace, monospace',
      spacingUnit: '4px',
      borderRadius: '0px', // Sharp edges design system
    },
    rules: {
      '.Input': {
        border: '1px solid #d1d5db',
        borderRadius: '0px',
        padding: '12px',
        fontSize: '14px',
        fontFamily: '"Typewriter", "Courier Prime", ui-monospace, monospace',
      },
      '.Input:focus': {
        border: '2px solid #000000',
        boxShadow: 'none',
      },
      '.Label': {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: '"Typewriter", "Courier Prime", ui-monospace, monospace',
      },
      '.Error': {
        fontSize: '12px',
        fontFamily: '"Typewriter", "Courier Prime", ui-monospace, monospace',
      },
    },
  },
  loader: 'auto' as const,
};