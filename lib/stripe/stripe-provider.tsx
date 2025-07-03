'use client'

import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'

interface StripeProviderProps {
  children: React.ReactNode
  clientSecret?: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const stripePromise = getStripe();
  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: '#000000',
          },
        },
      }
    : undefined

  return (
    <Elements stripe={stripePromise} {...(options && { options })}>
      {children}
    </Elements>
  )
}