import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { medusaClient } from '@/lib/medusa'

// Initialize Stripe with secret key
const stripeKey = process.env.STRIPE_SECRET_KEY || ''
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-05-28.basil' as any,
}) : null

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 503 }
      )
    }

    const { cartId } = await req.json()

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      )
    }

    // Get cart from Medusa
    const { cart } = await medusaClient.carts.retrieve(cartId)
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    // Calculate total amount in pence
    const amount = Math.round((cart.total || 0))

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: cart.region?.currency_code?.toLowerCase() || 'gbp',
      metadata: {
        cart_id: cartId,
        medusa_region_id: cart.region_id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Strike™ Order - Cart ${cartId}`,
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}