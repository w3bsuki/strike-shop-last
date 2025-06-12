"use client"

import { useState, useEffect } from 'react'
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CreditCard, ShieldCheck } from 'lucide-react'
import { stripePromise, stripeAppearance } from '@/lib/stripe'
import { medusaClient } from '@/lib/medusa'
import { useCartStore } from '@/lib/cart-store'
import { toast } from '@/hooks/use-toast'

interface StripePaymentFormProps {
  cartId: string
  onSuccess: (order: any) => void
}

function PaymentForm({ cartId, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { clearCart } = useCartStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        // Handle Stripe errors
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          setError(stripeError.message || 'Payment failed')
        } else {
          setError('An unexpected error occurred')
        }
        console.error('Stripe error:', stripeError)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful - complete the order with Medusa
        try {
          const { type, data } = await medusaClient.carts.complete(cartId)
          
          if (type === 'order') {
            // Clear the cart
            clearCart()
            
            // Show success message
            toast({
              title: "Order confirmed!",
              description: `Your order #${data.display_id} has been placed successfully.`,
            })
            
            // Call success callback
            onSuccess(data)
          }
        } catch (error) {
          console.error('Error completing order:', error)
          setError('Payment successful but order completion failed. Please contact support.')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Details
        </h3>
        
        <PaymentElement 
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Badges */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <Lock className="h-4 w-4 mr-1" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center">
          <ShieldCheck className="h-4 w-4 mr-1" />
          <span>SSL Encrypted</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full button-primary !py-4 text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          'Complete Order'
        )}
      </Button>

      {/* Stripe Branding */}
      <p className="text-xs text-center text-gray-500">
        Powered by <span className="font-semibold">Stripe</span>
      </p>
    </form>
  )
}

export default function StripePaymentForm({ cartId, onSuccess }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Create payment session with Medusa
    const initializePayment = async () => {
      try {
        // Create payment sessions
        await medusaClient.carts.createPaymentSessions(cartId)
        
        // Set Stripe as the payment provider
        const { cart } = await medusaClient.carts.setPaymentSession(cartId, {
          provider_id: 'stripe',
        })

        // Get the client secret from the payment session
        const stripeSession = cart.payment_session
        if (stripeSession && stripeSession.data && stripeSession.data.client_secret) {
          setClientSecret(stripeSession.data.client_secret)
        } else {
          // Fallback: create payment intent directly
          console.log('No client secret in payment session, creating via API...')
          const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cartId }),
          })
          
          if (response.ok) {
            const { client_secret } = await response.json()
            setClientSecret(client_secret)
          } else {
            throw new Error('Failed to create payment intent')
          }
        }
      } catch (error) {
        console.error('Error initializing payment:', error)
        setError('Failed to initialize payment. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (cartId) {
      initializePayment()
    }
  }, [cartId])

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600">Initializing payment...</p>
      </div>
    )
  }

  if (error || !clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || 'Failed to initialize payment. Please refresh and try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (!stripePromise) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Stripe is not configured. Please contact support.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <PaymentForm cartId={cartId} onSuccess={onSuccess} />
    </Elements>
  )
}