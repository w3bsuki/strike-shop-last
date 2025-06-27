import Stripe from 'stripe'

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Helper function to create a payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata,
  })
}

// Helper function to create a customer
export async function createStripeCustomer(
  email: string,
  metadata?: Record<string, string>
) {
  return await stripe.customers.create({
    email,
    metadata,
  })
}

// Helper function to retrieve a customer by email
export async function getStripeCustomerByEmail(email: string) {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })
  
  return customers.data[0] || null
}

// Helper function to attach a payment method to a customer
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  })
}

// Helper function to create a checkout session
export async function createCheckoutSession(
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  customerEmail: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata,
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ'],
    },
    billing_address_collection: 'required',
  })
}

// Helper function to construct webhook event
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}