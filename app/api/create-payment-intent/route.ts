import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, currency = 'usd', metadata } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Check if user has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', user.id)
      .single()
    
    const stripeCustomerId = profile?.metadata?.stripe_customer_id

    // Create payment intent with user metadata
    const paymentIntent = await createPaymentIntent(
      amount,
      currency,
      {
        ...metadata,
        user_id: user.id,
        user_email: user.email || '',
        stripe_customer_id: stripeCustomerId || null,
      }
    )

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}