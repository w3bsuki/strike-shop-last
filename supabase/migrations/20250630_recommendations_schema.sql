-- Product Recommendation System Database Schema
-- Migration: 20250630_recommendations_schema.sql
-- Created: June 30, 2025

-- User behavior tracking for recommendations
CREATE TABLE IF NOT EXISTS user_product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  product_id TEXT NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW(),
  view_duration INTEGER DEFAULT 0, -- seconds
  source TEXT DEFAULT 'direct', -- 'search', 'category', 'recommendation', 'direct'
  referrer_product_id TEXT -- If viewed from recommendation
);

-- Product interactions for comprehensive tracking
CREATE TABLE IF NOT EXISTS user_product_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'view', 'cart_add', 'wishlist_add', 'purchase', 'share'
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase history for collaborative filtering
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_title TEXT,
  variant_title TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  order_date TIMESTAMP DEFAULT NOW(),
  shopify_order_id TEXT,
  shopify_line_item_id TEXT
);

-- Product similarity matrix (pre-computed for performance)
CREATE TABLE IF NOT EXISTS product_similarities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_a TEXT NOT NULL,
  product_b TEXT NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_type TEXT NOT NULL, -- 'content', 'collaborative', 'hybrid', 'category'
  calculation_data JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_a, product_b, similarity_type)
);

-- Recommendation cache for performance
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id TEXT,
  recommendation_type TEXT NOT NULL,
  recommended_products JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product affinity scores (items frequently bought together)
CREATE TABLE IF NOT EXISTS product_affinities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_a TEXT NOT NULL,
  product_b TEXT NOT NULL,
  affinity_score DECIMAL(5,4) NOT NULL CHECK (affinity_score >= 0 AND affinity_score <= 1),
  support_count INTEGER NOT NULL DEFAULT 0, -- How many times they were bought together
  confidence DECIMAL(5,4) DEFAULT 0, -- P(B|A) - probability of buying B given A was bought
  lift DECIMAL(8,4) DEFAULT 1, -- How much more likely B is bought when A is bought
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_a, product_b)
);

-- User preference profiles for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_categories JSONB DEFAULT '[]',
  preferred_brands JSONB DEFAULT '[]',
  preferred_price_range JSONB DEFAULT '{}', -- {min: 0, max: 1000}
  style_preferences JSONB DEFAULT '{}',
  size_preferences JSONB DEFAULT '{}',
  color_preferences JSONB DEFAULT '[]',
  seasonal_preferences JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_product_views_user_id ON user_product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_views_session_id ON user_product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_user_product_views_product_id ON user_product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_views_viewed_at ON user_product_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_product_interactions_user_id ON user_product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_session_id ON user_product_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_product_id ON user_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_type ON user_product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_created_at ON user_product_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON order_items(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_date ON order_items(order_date DESC);

CREATE INDEX IF NOT EXISTS idx_product_similarities_product_a ON product_similarities(product_a);
CREATE INDEX IF NOT EXISTS idx_product_similarities_product_b ON product_similarities(product_b);
CREATE INDEX IF NOT EXISTS idx_product_similarities_type ON product_similarities(similarity_type);
CREATE INDEX IF NOT EXISTS idx_product_similarities_score ON product_similarities(similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_key ON recommendation_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user_id ON recommendation_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_session_id ON recommendation_cache(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires_at ON recommendation_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_product_affinities_product_a ON product_affinities(product_a);
CREATE INDEX IF NOT EXISTS idx_product_affinities_product_b ON product_affinities(product_b);
CREATE INDEX IF NOT EXISTS idx_product_affinities_score ON product_affinities(affinity_score DESC);

-- Enable Row Level Security
ALTER TABLE user_product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own product views" ON user_product_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product views" ON user_product_views
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own interactions" ON user_product_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON user_product_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own orders" ON order_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON order_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendation cache" ON recommendation_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Functions for recommendation calculations
CREATE OR REPLACE FUNCTION calculate_product_affinity()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate affinity scores when new orders are added
  -- This will be called by a background job
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update affinity calculations
CREATE OR REPLACE TRIGGER update_product_affinity_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_product_affinity();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_product_views IS 'Tracks product page views for recommendation engine';
COMMENT ON TABLE user_product_interactions IS 'Comprehensive user interaction tracking';
COMMENT ON TABLE order_items IS 'Purchase history for collaborative filtering';
COMMENT ON TABLE product_similarities IS 'Pre-computed product similarity scores';
COMMENT ON TABLE recommendation_cache IS 'Cached recommendation results for performance';
COMMENT ON TABLE product_affinities IS 'Market basket analysis - frequently bought together';
COMMENT ON TABLE user_preferences IS 'User preference profiles for personalization';