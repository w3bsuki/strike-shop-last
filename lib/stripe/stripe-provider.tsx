'use client'

import { Elements } from '@stripe/react-stripe-js'
import { stripePromise, STRIPE_CONFIG } from './config'

interface StripeProviderProps {
  children: React.ReactNode
  clientSecret?: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options = clientSecret
    ? {
        clientSecret,
        appearance: STRIPE_CONFIG.appearance,
      }
    : undefined

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}