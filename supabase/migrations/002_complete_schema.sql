-- Complete database schema migration for Strike Shop
-- This migration adds missing tables and fixes security issues

-- Create profiles table (was missing)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create addresses table for shipping/billing
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('billing', 'shipping')),
  is_default BOOLEAN DEFAULT FALSE,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Create audit_logs table for compliance and debugging
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'ERROR', 'MIGRATION')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart_sessions table to sync with Medusa
CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medusa_cart_id TEXT UNIQUE NOT NULL,
  session_id TEXT,
  region_id TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'usd',
  items JSONB DEFAULT '[]'::jsonb,
  shipping_address_id UUID REFERENCES addresses(id),
  billing_address_id UUID REFERENCES addresses(id),
  payment_session JSONB,
  subtotal INTEGER DEFAULT 0,
  tax_total INTEGER DEFAULT 0,
  shipping_total INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing indexes for performance (removed CONCURRENTLY for migrations)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, type, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_medusa_cart_id ON cart_sessions(medusa_cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at ON cart_sessions(expires_at);

-- Add missing indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_medusa_order_id ON orders(medusa_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_created_at ON stripe_webhooks(created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type_processed ON stripe_webhooks(event_type, processed);

-- Add check constraints for data integrity (with proper error handling)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payments_amount_positive') THEN
    ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_positive CHECK (amount > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_total_positive') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_total_positive CHECK (total_amount > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cart_sessions_total_non_negative') THEN
    ALTER TABLE cart_sessions ADD CONSTRAINT chk_cart_sessions_total_non_negative CHECK (total >= 0);
  END IF;
END $$;

-- Add updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_addresses_updated_at') THEN
    CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses 
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
    CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cart_sessions_updated_at') THEN
    CREATE TRIGGER update_cart_sessions_updated_at BEFORE UPDATE ON cart_sessions 
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- Create function to clean up expired cart sessions
CREATE OR REPLACE FUNCTION cleanup_expired_cart_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_sessions 
  WHERE expires_at < NOW() AND updated_at < (NOW() - INTERVAL '1 day');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO audit_logs (table_name, operation, new_data)
  VALUES ('cart_sessions', 'DELETE', jsonb_build_object('deleted_count', deleted_count));
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync cart with Medusa
CREATE OR REPLACE FUNCTION sync_cart_with_medusa(
  p_user_id UUID,
  p_medusa_cart_id TEXT,
  p_cart_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Upsert cart session
  INSERT INTO cart_sessions (
    user_id,
    medusa_cart_id,
    region_id,
    currency_code,
    items,
    subtotal,
    tax_total,
    shipping_total,
    total,
    payment_session
  )
  VALUES (
    p_user_id,
    p_medusa_cart_id,
    p_cart_data->>'region_id',
    p_cart_data->>'currency_code',
    p_cart_data->'items',
    (p_cart_data->>'subtotal')::INTEGER,
    (p_cart_data->>'tax_total')::INTEGER,
    (p_cart_data->>'shipping_total')::INTEGER,
    (p_cart_data->>'total')::INTEGER,
    p_cart_data->'payment_session'
  )
  ON CONFLICT (medusa_cart_id) 
  DO UPDATE SET 
    items = EXCLUDED.items,
    subtotal = EXCLUDED.subtotal,
    tax_total = EXCLUDED.tax_total,
    shipping_total = EXCLUDED.shipping_total,
    total = EXCLUDED.total,
    payment_session = EXCLUDED.payment_session,
    updated_at = NOW()
  RETURNING jsonb_build_object(
    'success', true,
    'cart_id', id,
    'medusa_cart_id', medusa_cart_id
  ) INTO result;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION sync_cart_with_medusa TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cart_sessions TO service_role;

-- Insert initial system configuration
INSERT INTO audit_logs (table_name, operation, new_data) 
VALUES ('system', 'MIGRATION', jsonb_build_object(
  'migration', '002_complete_schema',
  'timestamp', NOW(),
  'description', 'Complete database schema with missing tables and security fixes'
))
ON CONFLICT DO NOTHING;