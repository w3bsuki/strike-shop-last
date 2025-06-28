# 💳 Stripe + Medusa 2.0 Production Integration Plan

## Executive Summary
Complete production-ready integration plan for Stripe payments with Medusa 2.0, covering PCI compliance, 3D Secure authentication, multi-currency support, and subscription handling.

## 🏗️ Payment Flow Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │────▶│  Next.js App │────▶│ Medusa API  │
│   Browser    │     │   (Vercel)   │     │  (Render)    │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌──────────────┐
                     │    Stripe    │◀─────│   Webhooks   │
                     │   Elements   │      │   Handler    │
                     └──────────────┘      └──────────────┘
```

## 📋 Complete Integration Steps

### Step 1: Stripe Account Setup

#### 1.1 Production Configuration
```bash
# 1. Login to Stripe Dashboard (https://dashboard.stripe.com)
# 2. Complete business verification
# 3. Configure payment methods:
#    - Cards (Visa, Mastercard, Amex)
#    - Digital wallets (Apple Pay, Google Pay)
#    - Bank debits (ACH, SEPA)
#    - Local payment methods (based on regions)

# 4. Set up webhook endpoints:
Primary: https://api.strikeshop.com/stripe/hooks
Backup: https://api-backup.strikeshop.com/stripe/hooks

# 5. Configure webhook events (see section below)
```

#### 1.2 API Keys Management
```typescript
// Production keys structure
const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,        // sk_live_...
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY, // pk_live_...
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,   // whsec_...
  apiVersion: '2023-10-16',  // Lock API version
}
```

### Step 2: Medusa Backend Integration

#### 2.1 Install Stripe Provider
```bash
# For Medusa v2
npm install @medusajs/medusa-payment-stripe@preview

# Required peer dependencies
npm install stripe @stripe/stripe-js
```

#### 2.2 Configure Medusa
```typescript
// medusa-config.ts
import { defineConfig } from '@medusajs/framework/utils'

export default defineConfig({
  projectConfig: {
    // ... other config
  },
  modules: [
    {
      resolve: '@medusajs/medusa-payment-stripe',
      options: {
        apiKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        captureMethod: 'automatic', // or 'manual' for auth-capture flow
        automaticPaymentMethods: true,
        paymentIntentOptions: {
          metadata: {
            source: 'medusa',
            environment: process.env.NODE_ENV,
          },
        },
      },
    },
  ],
})
```

#### 2.3 Webhook Handler Implementation
```typescript
// src/api/stripe/webhooks/route.ts
import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    // CRITICAL: Use raw body for signature verification
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).send('Webhook processing failed')
  }

  res.status(200).json({ received: true })
}

// Configure raw body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
}
```

### Step 3: Frontend Integration

#### 3.1 Stripe Provider Setup
```typescript
// app/providers/stripe-provider.tsx
'use client'

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { useEffect, useState } from 'react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  {
    apiVersion: '2023-10-16',
    locale: 'en',
  }
)

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const [clientSecret, setClientSecret] = useState<string>()

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0570de',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '4px',
          },
        },
        loader: 'auto',
      }}
    >
      {children}
    </Elements>
  )
}
```

#### 3.2 Payment Component
```typescript
// app/components/checkout/payment-form.tsx
'use client'

import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PaymentForm({ 
  clientSecret,
  returnUrl 
}: { 
  clientSecret: string
  returnUrl: string 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)
    setError(undefined)

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              email: customerEmail,
              name: customerName,
              address: {
                line1: shippingAddress.line1,
                line2: shippingAddress.line2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postalCode,
                country: shippingAddress.countryCode,
              },
            },
          },
        },
        redirect: 'if_required', // Handle 3DS in-page when possible
      })

      if (submitError) {
        setError(submitError.message)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment successful, complete order
        await completeOrder(paymentIntent.id)
        router.push(`/order/confirmed/${orderId}`)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      console.error('Payment error:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement 
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        }}
      />
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded"
      >
        {processing ? 'Processing...' : `Pay ${formatPrice(amount)}`}
      </button>
    </form>
  )
}
```

### Step 4: Webhook Configuration

#### 4.1 Required Webhook Events
```javascript
// Configure these events in Stripe Dashboard
const requiredWebhooks = [
  // Payment events
  'payment_intent.succeeded',
  'payment_intent.payment_failed', 
  'payment_intent.canceled',
  'payment_intent.requires_action',
  
  // Checkout events
  'checkout.session.completed',
  'checkout.session.expired',
  
  // Refund events
  'charge.refunded',
  'charge.refund.updated',
  
  // Dispute events
  'charge.dispute.created',
  'charge.dispute.updated',
  
  // Customer events
  'customer.created',
  'customer.updated',
  
  // Subscription events (if using)
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]
```

#### 4.2 Webhook Security
```typescript
// src/middleware/stripe-webhook.ts
export async function verifyStripeWebhook(
  req: Request,
  endpointSecret: string
): Promise<Stripe.Event> {
  const sig = req.headers.get('stripe-signature')
  
  if (!sig) {
    throw new Error('No stripe signature found')
  }

  const body = await req.text()
  
  try {
    return stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    throw new Error('Invalid signature')
  }
}

// Implement idempotency
const processedEvents = new Set<string>()

export async function handleWebhookEvent(event: Stripe.Event) {
  // Prevent duplicate processing
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed`)
    return
  }
  
  processedEvents.add(event.id)
  
  // Process event...
  
  // Clean up old events (optional)
  if (processedEvents.size > 10000) {
    const eventsArray = Array.from(processedEvents)
    eventsArray.slice(0, 5000).forEach(id => processedEvents.delete(id))
  }
}
```

### Step 5: Payment Methods Configuration

#### 5.1 Multi-Currency Setup
```typescript
// src/services/payment/stripe-multi-currency.ts
export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>
) {
  // Handle zero-decimal currencies
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'UGX']
  const finalAmount = zeroDecimalCurrencies.includes(currency.toUpperCase())
    ? amount
    : amount * 100

  return await stripe.paymentIntents.create({
    amount: finalAmount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      ...metadata,
      currency_original: currency,
      amount_original: amount.toString(),
    },
  })
}
```

#### 5.2 Regional Payment Methods
```typescript
// Configure payment methods by region
const paymentMethodsByRegion = {
  US: ['card', 'apple_pay', 'google_pay', 'afterpay_clearpay'],
  EU: ['card', 'sepa_debit', 'ideal', 'bancontact', 'giropay'],
  UK: ['card', 'apple_pay', 'google_pay', 'bacs_debit'],
  JP: ['card', 'konbini', 'jcb'],
  // Add more regions as needed
}

export function getPaymentMethodsForRegion(countryCode: string) {
  const region = getRegionFromCountry(countryCode)
  return paymentMethodsByRegion[region] || ['card']
}
```

### Step 6: Testing Strategy

#### 6.1 Test Cards
```typescript
// Test cards for different scenarios
const testCards = {
  success: '4242424242424242',
  requiresAuthentication: '4000002500003155',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
  processingError: '4000000000000119',
  
  // 3D Secure test cards
  '3ds_required': '4000002760003184',
  '3ds_optional': '4000002500003155',
  
  // International cards
  uk: '4000008260000000',
  jp: '4000007640000005',
  mx: '4000004840000008',
}
```

#### 6.2 Integration Tests
```typescript
// __tests__/stripe-integration.test.ts
import { stripe } from '@/lib/stripe'

describe('Stripe Integration', () => {
  it('should create payment intent', async () => {
    const intent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: 'usd',
      metadata: { orderId: 'test_order_123' },
    })
    
    expect(intent.id).toMatch(/^pi_/)
    expect(intent.amount).toBe(2000)
    expect(intent.currency).toBe('usd')
  })
  
  it('should handle webhook signature verification', async () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' })
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    })
    
    const event = stripe.webhooks.constructEvent(
      payload,
      header,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    expect(event.type).toBe('payment_intent.succeeded')
  })
})
```

### Step 7: Production Monitoring

#### 7.1 Payment Analytics
```typescript
// src/analytics/payment-metrics.ts
export async function trackPaymentMetrics(paymentIntent: Stripe.PaymentIntent) {
  const metrics = {
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    paymentMethod: paymentIntent.payment_method_types[0],
    processingTime: Date.now() - paymentIntent.created * 1000,
    requires3DS: paymentIntent.confirmation_method === 'automatic',
  }
  
  // Send to analytics service
  await analytics.track('payment_processed', metrics)
  
  // Monitor conversion rates
  if (paymentIntent.status === 'succeeded') {
    await analytics.increment('payments.success')
  } else {
    await analytics.increment('payments.failed')
  }
}
```

#### 7.2 Error Monitoring
```typescript
// src/monitoring/stripe-errors.ts
export function monitorStripeErrors(error: Stripe.StripeError) {
  const errorData = {
    type: error.type,
    code: error.code,
    message: error.message,
    declineCode: error.decline_code,
    paymentIntent: error.payment_intent?.id,
  }
  
  // Log to error tracking service
  Sentry.captureException(error, {
    tags: {
      component: 'stripe',
      errorType: error.type,
    },
    extra: errorData,
  })
  
  // Track specific error types
  if (error.type === 'card_error') {
    analytics.track('payment_card_error', {
      code: error.code,
      declineCode: error.decline_code,
    })
  }
}
```

## 🔒 Security Best Practices

### PCI Compliance Checklist
- [ ] Never store card details on your servers
- [ ] Use Stripe Elements or Payment Element
- [ ] Serve checkout pages over HTTPS only
- [ ] Implement proper access controls
- [ ] Regular security audits
- [ ] Use tokenization for card data
- [ ] Implement fraud detection rules
- [ ] Monitor for suspicious activity

### API Key Security
```bash
# Never commit keys to version control
# Use environment variables
# Rotate keys regularly
# Use restricted keys where possible

# Create restricted keys in Stripe Dashboard
# - Read-only keys for analytics
# - Write-only keys for payment processing
# - Webhook-only endpoints
```

## 🚨 Common Production Issues

### Issue 1: 3D Secure Authentication Loops
```typescript
// Solution: Proper return URL handling
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/payment/confirm`,
  },
  redirect: 'if_required',
})

// Handle authentication in payment confirm page
if (paymentIntent?.status === 'requires_action') {
  const { error } = await stripe.confirmCardPayment(clientSecret)
  // Handle result
}
```

### Issue 2: Webhook Timeouts
```typescript
// Solution: Async processing
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const event = await verifyWebhook(req)
  
  // Respond immediately
  res.status(200).json({ received: true })
  
  // Process async
  processWebhookAsync(event).catch(console.error)
}
```

### Issue 3: Currency Conversion Errors
```typescript
// Solution: Centralized currency handling
export function convertToStripeAmount(amount: number, currency: string): number {
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW', 'VND'])
  
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) {
    return Math.round(amount)
  }
  
  return Math.round(amount * 100)
}
```

## 📊 Performance Optimization

### 1. Optimize Stripe.js Loading
```typescript
// Lazy load Stripe.js
const loadStripe = () => import('@stripe/stripe-js').then(m => m.loadStripe)

// Preconnect to Stripe
<link rel="preconnect" href="https://js.stripe.com" />
<link rel="dns-prefetch" href="https://api.stripe.com" />
```

### 2. Implement Request Caching
```typescript
// Cache customer data
const customerCache = new Map<string, Stripe.Customer>()

export async function getCustomer(customerId: string) {
  if (customerCache.has(customerId)) {
    return customerCache.get(customerId)
  }
  
  const customer = await stripe.customers.retrieve(customerId)
  customerCache.set(customerId, customer)
  
  return customer
}
```

### 3. Batch Operations
```typescript
// Batch refunds
export async function batchRefunds(charges: string[]) {
  const refunds = await Promise.all(
    charges.map(charge => 
      stripe.refunds.create({ charge })
        .catch(err => ({ error: err, charge }))
    )
  )
  
  return refunds
}
```

## 🚀 Go-Live Checklist

### Pre-Launch (1 Week Before)
- [ ] Complete business verification in Stripe
- [ ] Test all payment flows with real cards
- [ ] Verify webhook endpoints are accessible
- [ ] Configure fraud detection rules
- [ ] Set up monitoring and alerts
- [ ] Review and test refund processes
- [ ] Confirm PCI compliance

### Launch Day
- [ ] Switch to production API keys
- [ ] Enable production webhooks
- [ ] Monitor first transactions closely
- [ ] Test payment flow as customer
- [ ] Verify webhook processing
- [ ] Check error rates

### Post-Launch (First Week)
- [ ] Monitor conversion rates
- [ ] Review declined payments
- [ ] Optimize checkout flow
- [ ] Address any integration issues
- [ ] Set up automated reports
- [ ] Plan for scaling

## 📈 Scaling Considerations

### High-Volume Optimizations
1. **Implement idempotency keys** for all payment operations
2. **Use Stripe Connect** for marketplace scenarios
3. **Enable Radar** for advanced fraud detection
4. **Implement webhooks queuing** for high volume
5. **Use payment links** for simplified checkout
6. **Cache payment methods** for returning customers

This comprehensive integration plan ensures secure, scalable, and compliant payment processing with Stripe and Medusa 2.0.