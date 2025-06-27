-- Create a table to store Stripe webhook events
CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX idx_stripe_webhooks_event_id ON stripe_webhooks(stripe_event_id);
CREATE INDEX idx_stripe_webhooks_processed ON stripe_webhooks(processed);
CREATE INDEX idx_stripe_webhooks_event_type ON stripe_webhooks(event_type);

-- Create a table for payment records
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for payment lookups
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  payment_id UUID REFERENCES payments(id),
  medusa_order_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for order lookups
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_payment_id ON orders(payment_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Function to process Stripe webhook events
CREATE OR REPLACE FUNCTION process_stripe_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Process different event types
  CASE NEW.event_type
    WHEN 'payment_intent.succeeded' THEN
      -- Update payment record
      INSERT INTO payments (
        stripe_payment_intent_id,
        stripe_customer_id,
        amount,
        currency,
        status,
        metadata,
        user_id
      )
      VALUES (
        NEW.data->>'id',
        NEW.data->'customer',
        (NEW.data->>'amount')::INTEGER,
        NEW.data->>'currency',
        'succeeded',
        NEW.data->'metadata',
        (NEW.data->'metadata'->>'user_id')::UUID
      )
      ON CONFLICT (stripe_payment_intent_id) 
      DO UPDATE SET 
        status = 'succeeded',
        updated_at = NOW();

      -- Update order status
      UPDATE orders 
      SET 
        status = 'paid',
        updated_at = NOW()
      WHERE stripe_payment_intent_id = NEW.data->>'id';

    WHEN 'payment_intent.payment_failed' THEN
      -- Update payment record
      UPDATE payments 
      SET 
        status = 'failed',
        updated_at = NOW()
      WHERE stripe_payment_intent_id = NEW.data->>'id';

      -- Update order status
      UPDATE orders 
      SET 
        status = 'payment_failed',
        updated_at = NOW()
      WHERE stripe_payment_intent_id = NEW.data->>'id';

    WHEN 'checkout.session.completed' THEN
      -- Handle checkout session completion
      INSERT INTO orders (
        user_id,
        stripe_payment_intent_id,
        status,
        total_amount,
        currency,
        items,
        shipping_address,
        billing_address,
        metadata
      )
      VALUES (
        (NEW.data->'metadata'->>'user_id')::UUID,
        NEW.data->'payment_intent',
        'processing',
        (NEW.data->>'amount_total')::INTEGER,
        NEW.data->>'currency',
        NEW.data->'metadata'->'items',
        NEW.data->'shipping',
        NEW.data->'customer_details',
        NEW.data->'metadata'
      );

    WHEN 'customer.created' THEN
      -- Update user profile with Stripe customer ID
      UPDATE profiles 
      SET 
        metadata = COALESCE(metadata, '{}'::JSONB) || 
                   jsonb_build_object('stripe_customer_id', NEW.data->>'id'),
        updated_at = NOW()
      WHERE email = NEW.data->>'email';

    ELSE
      -- Log unhandled event types
      NULL;
  END CASE;

  -- Mark webhook as processed
  NEW.processed = TRUE;
  NEW.processed_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    NEW.error = SQLERRM;
    NEW.processed = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to process webhooks
CREATE TRIGGER process_stripe_webhook_trigger
  BEFORE INSERT OR UPDATE ON stripe_webhooks
  FOR EACH ROW
  WHEN (NEW.processed = FALSE)
  EXECUTE FUNCTION process_stripe_webhook();

-- Function to handle Stripe webhook endpoint with security and idempotency
CREATE OR REPLACE FUNCTION handle_stripe_webhook(
  payload JSONB,
  signature TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  event_id TEXT;
BEGIN
  -- Basic signature validation (signature should be verified by application layer)
  IF signature IS NULL THEN
    RAISE EXCEPTION 'Missing webhook signature';
  END IF;

  -- Extract event ID for idempotency check
  event_id := payload->>'id';
  
  -- Check if webhook already processed (idempotency)
  IF EXISTS (SELECT 1 FROM stripe_webhooks WHERE stripe_event_id = event_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Webhook already processed'
    );
  END IF;

  -- Insert the webhook event
  INSERT INTO stripe_webhooks (
    stripe_event_id,
    event_type,
    data,
    processed
  )
  VALUES (
    event_id,
    payload->>'type',
    payload->'data'->'object',
    FALSE
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Webhook received and queued for processing'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging
    INSERT INTO stripe_webhooks (
      stripe_event_id,
      event_type,
      data,
      processed,
      error
    )
    VALUES (
      COALESCE(payload->>'id', 'unknown'),
      COALESCE(payload->>'type', 'unknown'),
      payload,
      FALSE,
      SQLERRM
    )
    ON CONFLICT (stripe_event_id) DO NOTHING;
    
    -- Return error response
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Internal server error'
    );
END;
$$ LANGUAGE plpgsql;

-- SECURITY FIX: Revoke dangerous permissions to anonymous and authenticated users
-- This was a critical security vulnerability - webhooks should only be accessible to service role
REVOKE EXECUTE ON FUNCTION handle_stripe_webhook FROM anon;
REVOKE EXECUTE ON FUNCTION handle_stripe_webhook FROM authenticated;
-- Grant execute permission only to service role for production security
GRANT EXECUTE ON FUNCTION handle_stripe_webhook TO service_role;

-- Enable RLS on tables
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for stripe_webhooks (admin only)
CREATE POLICY "Service role can manage webhooks" ON stripe_webhooks
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');