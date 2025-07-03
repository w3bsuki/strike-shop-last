// Product Recommendation System Types
// Types for the recommendation engine and related functionality

import type { IntegratedProduct } from './integrated';

// Base recommendation request interface
export interface RecommendationRequest {
  userId?: string;
  sessionId?: string;
  productId?: string;
  type: RecommendationType;
  limit?: number;
  excludeProductIds?: string[];
  category?: string;
  priceRange?: PriceRange;
  metadata?: Record<string, any>;
}

// Recommendation response interface
export interface RecommendationResponse {
  products: IntegratedProduct[];
  algorithm: string;
  confidence: number;
  cached: boolean;
  generatedAt: string;
  expiresAt: string;
  metadata?: RecommendationMetadata;
}

// Types of recommendations available
export type RecommendationType = 
  | 'similar'              // Content-based similar products
  | 'collaborative'        // User-based collaborative filtering
  | 'frequently_bought'    // Market basket analysis
  | 'recently_viewed'      // Session-based recent views
  | 'trending'            // Popular/trending products
  | 'personalized'        // AI-driven personalized recommendations
  | 'category_popular'    // Popular in same category
  | 'price_similar'       // Similar price range
  | 'brand_related'       // Same brand recommendations
  | 'seasonal';           // Seasonal/trending recommendations

// Price range filter
export interface PriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

// User behavior tracking
export interface UserBehavior {
  productViews: ProductView[];
  cartAdditions: CartAddition[];
  purchases: Purchase[];
  wishlistItems: WishlistItem[];
  searches: SearchQuery[];
}

export interface ProductView {
  id: string;
  userId?: string;
  sessionId?: string;
  productId: string;
  viewedAt: string;
  viewDuration: number; // seconds
  source: ViewSource;
  referrerProductId?: string;
}

export interface CartAddition {
  id: string;
  userId?: string;
  sessionId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;
  source: 'product_page' | 'recommendation' | 'search' | 'category';
}

export interface Purchase {
  id: string;
  userId: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productTitle: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  total: number;
  orderDate: string;
  shopifyOrderId?: string;
  shopifyLineItemId?: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;
}

export interface SearchQuery {
  id: string;
  userId?: string;
  sessionId?: string;
  query: string;
  searchedAt: string;
  resultCount: number;
  clickedProductId?: string;
}

export type ViewSource = 
  | 'direct'           // Direct URL access
  | 'search'           // From search results
  | 'category'         // From category page
  | 'recommendation'   // From recommendation
  | 'social'           // From social media
  | 'email'            // From email campaign
  | 'ads'              // From advertising
  | 'home';            // From homepage

// Product interaction types
export type InteractionType = 
  | 'view'
  | 'cart_add'
  | 'cart_remove'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'purchase'
  | 'share'
  | 'review'
  | 'search'
  | 'compare';

export interface ProductInteraction {
  id: string;
  userId?: string;
  sessionId?: string;
  productId: string;
  interactionType: InteractionType;
  interactionData: Record<string, any>;
  createdAt: string;
}

// Similarity and affinity models
export interface ProductSimilarity {
  id: string;
  productA: string;
  productB: string;
  similarityScore: number; // 0-1
  similarityType: SimilarityType;
  calculationData: Record<string, any>;
  updatedAt: string;
}

export type SimilarityType = 
  | 'content'        // Based on product attributes
  | 'collaborative'  // Based on user behavior
  | 'hybrid'         // Combination approach
  | 'category'       // Category-based similarity
  | 'visual'         // Image similarity (future)
  | 'textual';       // Description/title similarity

export interface ProductAffinity {
  id: string;
  productA: string;
  productB: string;
  affinityScore: number; // 0-1
  supportCount: number;  // How many times bought together
  confidence: number;    // P(B|A)
  lift: number;         // Lift ratio
  updatedAt: string;
}

// User preferences for personalization
export interface UserPreferences {
  id: string;
  userId: string;
  preferredCategories: string[];
  preferredBrands: string[];
  preferredPriceRange: PriceRange;
  stylePreferences: Record<string, any>;
  sizePreferences: Record<string, any>;
  colorPreferences: string[];
  seasonalPreferences: Record<string, any>;
  lastUpdated: string;
}

// Recommendation cache
export interface RecommendationCache {
  id: string;
  cacheKey: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  recommendationType: RecommendationType;
  recommendedProducts: IntegratedProduct[];
  metadata: RecommendationMetadata;
  expiresAt: string;
  createdAt: string;
}

// Metadata for recommendation tracking and analysis
export interface RecommendationMetadata {
  algorithm: string;
  version: string;
  confidence: number;
  processingTime: number; // milliseconds
  dataSource: string[];
  filters: Record<string, any>;
  abTestGroup?: string;
  qualityScore?: number;
  diversityScore?: number;
}

// Configuration for recommendation algorithms
export interface RecommendationConfig {
  contentBased: {
    categoryWeight: number;
    priceWeight: number;
    brandWeight: number;
    tagWeight: number;
    descriptionWeight: number;
  };
  collaborative: {
    minInteractions: number;
    similarityThreshold: number;
    neighborhoodSize: number;
  };
  marketBasket: {
    minSupport: number;
    minConfidence: number;
    minLift: number;
  };
  session: {
    maxAge: number; // hours
    weightDecay: number;
  };
  cache: {
    defaultTTL: number; // seconds
    maxSize: number;
  };
  quality: {
    minConfidence: number;
    maxSimilarityThreshold: number;
    diversityTarget: number;
  };
}

// A/B testing for recommendation algorithms
export interface RecommendationExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: RecommendationVariant[];
  trafficAllocation: Record<string, number>;
  startDate: string;
  endDate?: string;
  metrics: ExperimentMetrics;
}

export interface RecommendationVariant {
  id: string;
  name: string;
  algorithm: string;
  config: Partial<RecommendationConfig>;
  traffic: number; // percentage
}

export interface ExperimentMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cvr: number;
  avgOrderValue: number;
}

// Analytics and tracking
export interface RecommendationAnalytics {
  recommendationId: string;
  userId?: string;
  sessionId?: string;
  type: RecommendationType;
  algorithm: string;
  productIds: string[];
  event: RecommendationEvent;
  eventData: Record<string, any>;
  timestamp: string;
}

export type RecommendationEvent = 
  | 'displayed'    // Recommendation shown to user
  | 'clicked'      // User clicked on recommended product
  | 'added_to_cart' // User added recommended product to cart
  | 'purchased'    // User purchased recommended product
  | 'dismissed'    // User dismissed recommendation
  | 'shared';      // User shared recommended product

// Real-time recommendation updates
export interface RecommendationUpdate {
  userId?: string;
  sessionId?: string;
  trigger: UpdateTrigger;
  affectedTypes: RecommendationType[];
  invalidateCache: boolean;
  metadata: Record<string, any>;
}

export type UpdateTrigger = 
  | 'product_view'
  | 'cart_add'
  | 'purchase'
  | 'wishlist_add'
  | 'search'
  | 'profile_update'
  | 'new_product'
  | 'inventory_change';

// Error handling
export interface RecommendationError {
  code: string;
  message: string;
  type: RecommendationType;
  context: Record<string, any>;
  timestamp: string;
}

// Performance monitoring
export interface RecommendationPerformance {
  type: RecommendationType;
  algorithm: string;
  avgResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  qualityScore: number;
  diversityScore: number;
  timestamp: string;
}

// Bulk operations
export interface BulkRecommendationRequest {
  requests: RecommendationRequest[];
  options: {
    parallel: boolean;
    failFast: boolean;
    maxConcurrency: number;
  };
}

export interface BulkRecommendationResponse {
  responses: (RecommendationResponse | RecommendationError)[];
  metadata: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    processingTime: number;
  };
}