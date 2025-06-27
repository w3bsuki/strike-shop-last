import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OrderPayload {
  order_id: string
  user_id: string
  items: Array<{
    product_id: string
    variant_id: string
    quantity: number
    price: number
  }>
  shipping_address: any
  billing_address: any
  total: number
  payment_intent_id: string
}

serve(async (req) => {
  try {
    const { order_id } = await req.json()
    
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user email for Medusa
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', order.user_id)
      .single()

    // Create order in Medusa
    const medusaUrl = Deno.env.get('MEDUSA_BACKEND_URL') ?? 'http://localhost:9000'
    const medusaKey = Deno.env.get('MEDUSA_API_KEY') ?? ''
    
    const medusaOrder = {
      email: user?.email,
      region_id: Deno.env.get('MEDUSA_REGION_ID'),
      items: order.items,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      payment_method: {
        provider_id: 'stripe',
        data: {
          payment_intent_id: order.stripe_payment_intent_id,
        },
      },
      metadata: {
        supabase_order_id: order.id,
        stripe_payment_intent_id: order.stripe_payment_intent_id,
      },
    }

    const response = await fetch(`${medusaUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': medusaKey,
      },
      body: JSON.stringify(medusaOrder),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Medusa error:', error)
      throw new Error('Failed to create order in Medusa')
    }

    const { cart } = await response.json()

    // Complete the cart to create an order
    const completeResponse = await fetch(
      `${medusaUrl}/store/carts/${cart.id}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': medusaKey,
        },
      }
    )

    if (!completeResponse.ok) {
      throw new Error('Failed to complete order in Medusa')
    }

    const { order: medusaOrderResult } = await completeResponse.json()

    // Update our order with Medusa order ID
    await supabase
      .from('orders')
      .update({ 
        medusa_order_id: medusaOrderResult.id,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order_id,
        medusa_order_id: medusaOrderResult.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Sync error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})