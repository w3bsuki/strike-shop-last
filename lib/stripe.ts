import { loadStripe } from '@stripe/stripe-js'

// Ensure we have the Stripe publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable')
}

// Initialize Stripe
export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null

// Stripe appearance customization to match Strike™ branding
export const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#000000',
    colorBackground: '#ffffff',
    colorText: '#000000',
    colorDanger: '#dc2626',
    fontFamily: '"Typewriter", "Courier Prime", ui-monospace, monospace',
    fontSizeBase: '14px',
    spacingUnit: '4px',
    borderRadius: '2px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e5e5',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #000000',
      boxShadow: '0 0 0 1px #000000',
    },
    '.Label': {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '4px',
    },
    '.Error': {
      fontSize: '12px',
      marginTop: '4px',
    },
  },
}

// Helper function to format amount for Stripe (converts to cents)
export const formatAmountForStripe = (amount: number, currency: string = 'gbp'): number => {
  const numberFormat = new Intl.NumberFormat(['en-GB'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

// Helper function to format Stripe amount for display
export const formatStripeAmount = (amount: number, currency: string = 'gbp'): string => {
  const numberFormat = new Intl.NumberFormat(['en-GB'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  
  return numberFormat.format(amount / 100)
}