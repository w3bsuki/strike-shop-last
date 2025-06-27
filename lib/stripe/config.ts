import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe.js with your publishable key
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

// Stripe configuration
export const STRIPE_CONFIG = {
  // Payment method types to accept
  paymentMethodTypes: ['card', 'apple_pay', 'google_pay'],
  
  // Appearance customization for Stripe Elements
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorSurface: '#ffffff',
      colorText: '#000000',
      colorDanger: '#df1b41',
      fontFamily: '"Courier Prime", monospace',
      spacingUnit: '4px',
      borderRadius: '0px',
    },
    rules: {
      '.Input': {
        border: '1px solid #000000',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '2px solid #000000',
        boxShadow: 'none',
      },
      '.Label': {
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '12px',
      },
    },
  },
  
  // Payment intent options
  paymentIntentOptions: {
    setup_future_usage: 'off_session' as const,
    capture_method: 'automatic' as const,
  },
}