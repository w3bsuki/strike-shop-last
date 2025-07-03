// Product Recommendation Engine
// Core engine for generating product recommendations using multiple algorithms

import { createClient } from '@supabase/supabase-js';
import { ShopifyService } from '../shopify/services';
import type { 
  RecommendationRequest, 
  RecommendationResponse, 
  RecommendationConfig,
  ProductSimilarity,
  ProductAffinity,
  UserBehavior,
  UserPreferences,
  RecommendationCache,
  RecommendationMetadata,
  RecommendationType
} from '@/types/recommendations';
import type { IntegratedProduct } from '@/types/integrated';

export class RecommendationEngine {
  private supabase;
  private config: RecommendationConfig;
  private shopifyService: typeof ShopifyService;

  constructor() {
    // Make Supabase optional - use only if env vars are provided
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    } else {
      // Create a dummy client that will throw if used
      this.supabase = null as any;
    }
    
    this.shopifyService = ShopifyService;
    
    // Default configuration
    this.config = {
      contentBased: {
        categoryWeight: 0.4,
        priceWeight: 0.2,
        brandWeight: 0.2,
        tagWeight: 0.15,
        descriptionWeight: 0.05
      },
      collaborative: {
        minInteractions: 5,
        similarityThreshold: 0.1,
        neighborhoodSize: 50
      },
      marketBasket: {
        minSupport: 0.01,
        minConfidence: 0.1,
        minLift: 1.1
      },
      session: {
        maxAge: 24, // hours
        weightDecay: 0.8
      },
      cache: {
        defaultTTL: 3600, // 1 hour
        maxSize: 10000
      },
      quality: {
        minConfidence: 0.1,
        maxSimilarityThreshold: 0.95,
        diversityTarget: 0.7
      }
    };
  }

  /**
   * Main recommendation generation method
   */
  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await this.getCachedRecommendations(request);
      if (cached && !this.isCacheExpired(cached)) {
        return this.formatResponse(cached.recommendedProducts, {
          algorithm: 'cached',
          version: '1.0',
          confidence: 0.9,
          processingTime: Date.now() - startTime,
          dataSource: ['cache'],
          filters: {}
        }, true);
      }

      // Generate fresh recommendations based on type
      let products: IntegratedProduct[] = [];
      let metadata: RecommendationMetadata;

      switch (request.type) {
        case 'similar':
          const similarResult = await this.getContentBasedRecommendations(request);
          products = similarResult.products;
          metadata = similarResult.metadata;
          break;
          
        case 'collaborative':
          const collaborativeResult = await this.getCollaborativeRecommendations(request);
          products = collaborativeResult.products;
          metadata = collaborativeResult.metadata;
          break;
          
        case 'frequently_bought':
          const frequentResult = await this.getFrequentlyBoughtTogether(request);
          products = frequentResult.products;
          metadata = frequentResult.metadata;
          break;
          
        case 'recently_viewed':
          const recentResult = await this.getSessionBasedRecommendations(request);
          products = recentResult.products;
          metadata = recentResult.metadata;
          break;
          
        case 'trending':
          const trendingResult = await this.getTrendingProducts(request);
          products = trendingResult.products;
          metadata = trendingResult.metadata;
          break;
          
        case 'personalized':
          const personalizedResult = await this.getPersonalizedRecommendations(request);
          products = personalizedResult.products;
          metadata = personalizedResult.metadata;
          break;
          
        default:
          throw new Error(`Unsupported recommendation type: ${request.type}`);
      }

      // Apply filters and quality checks
      products = await this.applyFilters(products, request);
      products = await this.ensureQuality(products, request);
      products = await this.ensureDiversity(products, request);

      // Limit results
      const limit = request.limit || 6;
      products = products.slice(0, limit);

      // Cache the results
      await this.cacheRecommendations(request, products, metadata);

      // Final metadata update
      metadata.processingTime = Date.now() - startTime;

      return this.formatResponse(products, metadata, false);

    } catch (error) {
      console.error('Recommendation generation error:', error);
      
      // Fallback to basic recommendations
      const fallbackProducts = await this.getFallbackRecommendations(request);
      
      return this.formatResponse(fallbackProducts, {
        algorithm: 'fallback',
        version: '1.0',
        confidence: 0.3,
        processingTime: Date.now() - startTime,
        dataSource: ['fallback'],
        filters: {}
      }, false);
    }
  }

  /**
   * Content-based recommendations using product similarity
   */
  private async getContentBasedRecommendations(
    request: RecommendationRequest
  ): Promise<{ products: IntegratedProduct[], metadata: RecommendationMetadata }> {
    if (!request.productId) {
      throw new Error('Product ID required for content-based recommendations');
    }

    const startTime = Date.now();
    
    // Get the source product  
    const allProducts = await this.shopifyService.getProducts(100);
    const sourceProduct = allProducts.find(p => p.id === request.productId);
    if (!sourceProduct) {
      throw new Error('Source product not found');
    }

    // Get similar products from cache or calculate
    let similarProducts: IntegratedProduct[] = [];
    
    // First try pre-computed similarities
    const { data: similarities } = await this.supabase
      .from('product_similarities')
      .select('product_b, similarity_score')
      .eq('product_a', request.productId)
      .eq('similarity_type', 'content')
      .order('similarity_score', { ascending: false })
      .limit(request.limit || 20);

    if (similarities && similarities.length > 0) {
      // Use pre-computed similarities
      const productIds = similarities.map(s => s.product_b);
      // Fetch all products and filter by IDs
      const allProducts = await this.shopifyService.getProducts(100);
      const products = allProducts.filter(p => productIds.includes(p.id));
      similarProducts = products.filter(p => p.id !== request.productId);
    } else {
      // Calculate similarities on the fly
      similarProducts = await this.calculateContentSimilarity(sourceProduct, request.limit || 20);
    }

    const metadata: RecommendationMetadata = {
      algorithm: 'content_based',
      version: '1.0',
      confidence: 0.8,
      processingTime: Date.now() - startTime,
      dataSource: similarities ? ['pre_computed'] : ['real_time'],
      filters: {
        sourceProduct: request.productId,
        excludeProducts: request.excludeProductIds || []
      }
    };

    return { products: similarProducts, metadata };
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    request: RecommendationRequest
  ): Promise<{ products: IntegratedProduct[], metadata: RecommendationMetadata }> {
    if (!request.userId) {
      throw new Error('User ID required for collaborative recommendations');
    }

    const startTime = Date.now();

    // Get user's behavior
    const userBehavior = await this.getUserBehavior(request.userId);
    
    // Find similar users
    const similarUsers = await this.findSimilarUsers(request.userId, userBehavior);
    
    // Get recommendations from similar users
    const recommendations = await this.generateCollaborativeRecommendations(
      userBehavior,
      similarUsers,
      request.limit || 10
    );

    const metadata: RecommendationMetadata = {
      algorithm: 'collaborative_filtering',
      version: '1.0',
      confidence: similarUsers.length > 0 ? 0.7 : 0.3,
      processingTime: Date.now() - startTime,
      dataSource: ['user_behavior', 'similar_users'],
      filters: {
        userId: request.userId,
        similarUserCount: similarUsers.length,
        minInteractions: this.config.collaborative.minInteractions
      }
    };

    return { products: recommendations, metadata };
  }

  /**
   * Market basket analysis - frequently bought together
   */
  private async getFrequentlyBoughtTogether(
    request: RecommendationRequest
  ): Promise<{ products: IntegratedProduct[], metadata: RecommendationMetadata }> {
    if (!request.productId) {
      throw new Error('Product ID required for frequently bought together');
    }

    const startTime = Date.now();

    // Get product affinities
    const { data: affinities } = await this.supabase
      .from('product_affinities')
      .select('product_b, affinity_score, confidence, lift')
      .eq('product_a', request.productId)
      .gte('confidence', this.config.marketBasket.minConfidence)
      .gte('lift', this.config.marketBasket.minLift)
      .order('affinity_score', { ascending: false })
      .limit(request.limit || 10);

    let products: IntegratedProduct[] = [];
    
    if (affinities && affinities.length > 0) {
      const productIds = affinities.map(a => a.product_b);
      const allProducts = await this.shopifyService.getProducts(100);
      products = allProducts.filter(p => productIds.includes(p.id));
    } else {
      // Calculate on the fly if no pre-computed affinities
      products = await this.calculateMarketBasketAnalysis(request.productId, request.limit || 10);
    }

    const metadata: RecommendationMetadata = {
      algorithm: 'market_basket_analysis',
      version: '1.0',
      confidence: affinities && affinities.length > 0 ? 0.9 : 0.5,
      processingTime: Date.now() - startTime,
      dataSource: affinities ? ['pre_computed_affinities'] : ['real_time_analysis'],
      filters: {
        sourceProduct: request.productId,
        minConfidence: this.config.marketBasket.minConfidence,
        minLift: this.config.marketBasket.minLift
      }
    };

    return { products, metadata };
  }

  /**
   * Session-based recommendations from recently viewed products
   */
  private async getSessionBasedRecommendations(
    request: RecommendationRequest
  ): Promise<{ products: IntegratedProduct[], metadata: RecommendationMetadata }> {
    if (!request.sessionId && !request.userId) {
      throw new Error('Session ID or User ID required for session-based recommendations');
    }

    const startTime = Date.now();

    // Get recent product views
    let query = this.supabase
      .from('user_product_views')
      .select('product_id, viewed_at, view_duration')
      .order('viewed_at', { ascending: false })
      .limit(50);

    if (request.userId) {
      query = query.eq('user_id', request.userId);
    } else {
      query = query.eq('session_id', request.sessionId);
    }

    const { data: views } = await query;

    let products: IntegratedProduct[] = [];
    
    if (views && views.length > 0) {
      // Get unique product IDs (recently viewed)
      const recentProductIds = [...new Set(views.map(v => v.product_id))];
      
      // Get products with view weighting
      const allProducts = await this.shopifyService.getProducts(100);
      products = allProducts.filter(p => recentProductIds.includes(p.id));
      
      // Apply recency weighting
      products = this.applyRecencyWeighting(products, views);
    }

    const metadata: RecommendationMetadata = {
      algorithm: 'session_based',
      version: '1.0',
      confidence: views && views.length > 0 ? 0.6 : 0.2,
      processingTime: Date.now() - startTime,
      dataSource: ['session_views'],
      filters: {
        sessionId: request.sessionId,
        userId: request.userId,
        viewCount: views?.length || 0
      }
    };

    return { products, metadata };
  }

  /**
   * Trending products based on recent popularity
   */
  private async getTrendingProducts(
    request: RecommendationRequest
  ): Promise<{ products: IntegratedProduct[], metadata: RecommendationMetadata }> {
    const startTime = Date.now();

    // Get trending products based on recent views
    const { data: recentViews } = await this.supabase
      .from('user_product_views')
      .select('product_id')
      .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
    
    // Count occurrences manually
    const productCounts = new Map<string, number>();
    if (recentViews) {
      recentViews.forEach(view => {
        const count = productCounts.get(view.product_id) || 0;
        productCounts.set(view.product_id, count + 1);
      });
    }
    
    // Sort by count and get top products
    const trending = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, request.limit || 20)
      .map(([product_id]) => ({ product_id }));

    let products: IntegratedProduct[] = [];
    
    if (trending && trending.length > 0) {
      const productIds = trending.map(t => t.product_id);
      const allProducts = await this.shopifyService.getProducts(100);
      products = allProducts.filter(p => productIds.includes(p.id));
    } else {
      // Fallback to recent products
      products = await this.shopifyService.getProducts(request.limit || 20);
    }

    const metadata: RecommendationMetadata = {
      algorithm: 'trending_products',
      version: '1.0',
      confidence: 0.8,
      processingTime: Date.now() - startTime,
      dataSource: ['view_analytics'],
      filters: {
        timeWindow: '7_days',
        category: request.category
      }
    };

    return { products, metadata };
  }

  /**
   * Personalized recommendations using user preferences
   */
  private async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<{ products: IntegratedProduct[], metadata: RecommendationMetadata }> {
    if (!request.userId) {
      throw new Error('User ID required for personalized recommendations');
    }

    const startTime = Date.now();

    // Get user preferences
    const { data: preferences } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', request.userId)
      .single();

    // Get user behavior
    const userBehavior = await this.getUserBehavior(request.userId);

    // Generate personalized recommendations
    const products = await this.generatePersonalizedRecommendations(
      preferences,
      userBehavior,
      request.limit || 10
    );

    const metadata: RecommendationMetadata = {
      algorithm: 'personalized_ai',
      version: '1.0',
      confidence: 0.9,
      processingTime: Date.now() - startTime,
      dataSource: ['user_preferences', 'user_behavior'],
      filters: {
        userId: request.userId,
        hasPreferences: !!preferences
      }
    };

    return { products, metadata };
  }

  /**
   * Helper methods
   */

  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    const [views, interactions, purchases] = await Promise.all([
      this.supabase
        .from('user_product_views')
        .select('*')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(100),
      
      this.supabase
        .from('user_product_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      
      this.supabase
        .from('order_items')
        .select('*')
        .eq('user_id', userId)
        .order('order_date', { ascending: false })
        .limit(50)
    ]);

    return {
      productViews: views.data || [],
      cartAdditions: interactions.data?.filter(i => i.interaction_type === 'cart_add') || [],
      purchases: purchases.data || [],
      wishlistItems: interactions.data?.filter(i => i.interaction_type === 'wishlist_add') || [],
      searches: interactions.data?.filter(i => i.interaction_type === 'search') || []
    };
  }

  private async calculateContentSimilarity(
    sourceProduct: IntegratedProduct,
    limit: number
  ): Promise<IntegratedProduct[]> {
    // Get all products and filter by category
    const allProducts = await this.shopifyService.getProducts(100);
    const categoryProducts = allProducts.filter(p => 
      p.content.categories?.some(cat => 
        sourceProduct.content.categories?.some(srcCat => srcCat.slug === cat.slug)
      )
    );

    // Calculate similarity scores
    const similarities = categoryProducts
      .filter(p => p.id !== sourceProduct.id)
      .map(product => ({
        product,
        similarity: this.calculateProductSimilarity(sourceProduct, product)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(item => item.product);
  }

  private calculateProductSimilarity(productA: IntegratedProduct, productB: IntegratedProduct): number {
    let similarity = 0;
    
    // Category similarity
    const hasCommonCategory = productA.content.categories?.some(catA => 
      productB.content.categories?.some(catB => catA.slug.current === catB.slug.current)
    );
    if (hasCommonCategory) {
      similarity += this.config.contentBased.categoryWeight;
    }
    
    // Price similarity (closer prices = higher similarity)
    const priceA = productA.commerce.prices?.[0]?.amount || 0;
    const priceB = productB.commerce.prices?.[0]?.amount || 0;
    const priceDiff = Math.abs(priceA - priceB);
    const maxPrice = Math.max(priceA, priceB);
    const priceSimiliarity = maxPrice > 0 ? 1 - (priceDiff / maxPrice) : 1;
    similarity += priceSimiliarity * this.config.contentBased.priceWeight;
    
    // Brand similarity
    if (productA.content.brand === productB.content.brand) {
      similarity += this.config.contentBased.brandWeight;
    }
    
    // Tag similarity
    const tagsA = new Set(productA.content.tags || []);
    const tagsB = new Set(productB.content.tags || []);
    const tagIntersection = new Set([...tagsA].filter(tag => tagsB.has(tag)));
    const tagUnion = new Set([...tagsA, ...tagsB]);
    const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;
    similarity += tagSimilarity * this.config.contentBased.tagWeight;

    return similarity;
  }

  private async findSimilarUsers(userId: string, userBehavior: UserBehavior): Promise<string[]> {
    // Find users with similar purchase/view patterns
    const userProductIds = new Set([
      ...userBehavior.productViews.map(v => v.productId),
      ...userBehavior.purchases.map(p => p.productId)
    ]);

    if (userProductIds.size === 0) return [];

    // Find users who have interacted with similar products
    const { data: similarUsers } = await this.supabase
      .from('user_product_views')
      .select('user_id, product_id')
      .in('product_id', Array.from(userProductIds))
      .neq('user_id', userId);

    if (!similarUsers) return [];

    // Calculate similarity scores for users
    const userSimilarities = new Map<string, number>();
    
    for (const view of similarUsers) {
      const similarity = userSimilarities.get(view.user_id) || 0;
      userSimilarities.set(view.user_id, similarity + 1);
    }

    // Return top similar users
    return Array.from(userSimilarities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.collaborative.neighborhoodSize)
      .map(([userId]) => userId);
  }

  private async generateCollaborativeRecommendations(
    userBehavior: UserBehavior,
    similarUsers: string[],
    limit: number
  ): Promise<IntegratedProduct[]> {
    if (similarUsers.length === 0) return [];

    // Get products liked by similar users
    const { data: similarUserProducts } = await this.supabase
      .from('user_product_interactions')
      .select('product_id, interaction_type')
      .in('user_id', similarUsers)
      .in('interaction_type', ['cart_add', 'purchase', 'wishlist_add']);

    if (!similarUserProducts) return [];

    // Score products based on similar user interactions
    const productScores = new Map<string, number>();
    
    for (const interaction of similarUserProducts) {
      const score = productScores.get(interaction.product_id) || 0;
      const weight = interaction.interaction_type === 'purchase' ? 3 : 
                     interaction.interaction_type === 'cart_add' ? 2 : 1;
      productScores.set(interaction.product_id, score + weight);
    }

    // Get top scoring products
    const topProducts = Array.from(productScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);

    const allProducts = await this.shopifyService.getProducts(100);
    return allProducts.filter(p => topProducts.includes(p.id));
  }

  private async calculateMarketBasketAnalysis(productId: string, limit: number): Promise<IntegratedProduct[]> {
    // Find products frequently bought together
    const { data: coOccurrences } = await this.supabase
      .from('order_items')
      .select('order_id, product_id')
      .neq('product_id', productId);

    if (!coOccurrences) return [];

    // Group by order
    const orderProducts = new Map<string, Set<string>>();
    
    for (const item of coOccurrences) {
      if (!orderProducts.has(item.order_id)) {
        orderProducts.set(item.order_id, new Set());
      }
      orderProducts.get(item.order_id)!.add(item.product_id);
    }

    // Find orders containing the source product
    const ordersWithProduct = Array.from(orderProducts.entries())
      .filter(([_, products]) => products.has(productId));

    if (ordersWithProduct.length === 0) return [];

    // Count co-occurrences
    const coOccurrenceCounts = new Map<string, number>();
    
    for (const [_, products] of ordersWithProduct) {
      for (const product of products) {
        if (product !== productId) {
          const count = coOccurrenceCounts.get(product) || 0;
          coOccurrenceCounts.set(product, count + 1);
        }
      }
    }

    // Calculate confidence and lift
    const totalOrders = orderProducts.size;
    const productOrderCount = ordersWithProduct.length;
    
    const recommendations = Array.from(coOccurrenceCounts.entries())
      .map(([product, coCount]) => {
        const confidence = coCount / productOrderCount;
        const support = coCount / totalOrders;
        
        return {
          productId: product,
          confidence,
          support,
          count: coCount
        };
      })
      .filter(item => item.confidence >= this.config.marketBasket.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    const productIds = recommendations.map(r => r.productId);
    const allProducts = await this.shopifyService.getProducts(100);
    return allProducts.filter(p => productIds.includes(p.id));
  }

  private applyRecencyWeighting(products: IntegratedProduct[], views: any[]): IntegratedProduct[] {
    const viewMap = new Map(views.map(v => [v.product_id, v]));
    
    return products
      .map(product => {
        const view = viewMap.get(product.id);
        if (view) {
          const hoursAgo = (Date.now() - new Date(view.viewed_at).getTime()) / (1000 * 60 * 60);
          const recencyWeight = Math.pow(this.config.session.weightDecay, hoursAgo);
          return { ...product, _recencyWeight: recencyWeight };
        }
        return product;
      })
      .sort((a, b) => {
        const weightA = '_recencyWeight' in a ? a._recencyWeight : 0;
        const weightB = '_recencyWeight' in b ? b._recencyWeight : 0;
        return weightB - weightA;
      });
  }

  private async generatePersonalizedRecommendations(
    preferences: any,
    userBehavior: UserBehavior,
    limit: number
  ): Promise<IntegratedProduct[]> {
    // Combine multiple signals for personalization
    const signals = [];
    
    // Add collaborative filtering
    if (userBehavior.productViews.length > 0) {
      const collaborative = await this.getCollaborativeRecommendations({
        userId: preferences?.user_id,
        type: 'collaborative',
        limit: Math.ceil(limit * 0.4)
      });
      signals.push(...collaborative.products);
    }
    
    // Add content-based from preferences
    if (preferences?.preferredCategories?.length > 0) {
      for (const category of preferences.preferredCategories.slice(0, 2)) {
        // Get all products and filter by category
        const allProducts = await this.shopifyService.getProducts(100);
        const categoryProducts = allProducts.filter(p => 
          p.content.categories?.some(cat => 
            cat.slug.current === category || cat.name === category
          )
        ).slice(0, Math.ceil(limit * 0.3));
        signals.push(...categoryProducts);
      }
    }
    
    // Add trending products
    const trending = await this.getTrendingProducts({
      type: 'trending',
      limit: Math.ceil(limit * 0.3)
    });
    signals.push(...trending.products);
    
    // Remove duplicates and limit
    const uniqueProducts = Array.from(
      new Map(signals.map(p => [p.id, p])).values()
    );
    
    return uniqueProducts.slice(0, limit);
  }

  private async applyFilters(products: IntegratedProduct[], request: RecommendationRequest): Promise<IntegratedProduct[]> {
    let filtered = products;
    
    // Exclude specific products
    if (request.excludeProductIds && request.excludeProductIds.length > 0) {
      filtered = filtered.filter(p => !request.excludeProductIds!.includes(p.id));
    }
    
    // Price range filter
    if (request.priceRange) {
      filtered = filtered.filter(p => {
        const price = p.commerce.prices?.[0]?.amount || 0;
        const min = request.priceRange!.min || 0;
        const max = request.priceRange!.max || Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Category filter
    if (request.category) {
      filtered = filtered.filter(p => 
        p.content.categories?.some(cat => 
          cat.slug.current === request.category || cat.name === request.category
        )
      );
    }
    
    return filtered;
  }

  private async ensureQuality(products: IntegratedProduct[], request: RecommendationRequest): Promise<IntegratedProduct[]> {
    // Remove products with low quality scores
    return products.filter(product => {
      // Check if product has essential data
      if (!product.content.images || product.content.images.length === 0) return false;
      if (!product.content.name || product.content.name.trim().length === 0) return false;
      if (!product.commerce.prices || product.commerce.prices.length === 0 || product.commerce.prices[0]?.amount === undefined || product.commerce.prices[0].amount <= 0) return false;
      
      return true;
    });
  }

  private async ensureDiversity(products: IntegratedProduct[], request: RecommendationRequest): Promise<IntegratedProduct[]> {
    if (products.length <= 1) return products;
    
    // Ensure diversity in categories and brands
    const diverseProducts: IntegratedProduct[] = [];
    const usedCategories = new Set<string>();
    const usedBrands = new Set<string>();
    
    for (const product of products) {
      const categoryCount = usedCategories.size;
      const brandCount = usedBrands.size;
      
      // Get first category slug as representative category
      const productCategory = product.content.categories?.[0]?.slug.current || 'uncategorized';
      const productBrand = product.content.brand || '';
      
      // Prefer products from different categories and brands
      if (!usedCategories.has(productCategory) || !usedBrands.has(productBrand)) {
        diverseProducts.push(product);
        usedCategories.add(productCategory);
        if (productBrand) usedBrands.add(productBrand);
      } else if (diverseProducts.length < (request.limit || 6)) {
        // Add remaining products if we haven't reached the limit
        diverseProducts.push(product);
      }
    }
    
    return diverseProducts;
  }

  private async getFallbackRecommendations(request: RecommendationRequest): Promise<IntegratedProduct[]> {
    // Simple fallback: get popular products
    const limit = request.limit || 6;
    
    try {
      const allProducts = await this.shopifyService.getProducts(100);
      
      if (request.category) {
        return allProducts
          .filter(p => 
            p.content.categories?.some(cat => 
              cat.slug.current === request.category || cat.name === request.category
            )
          )
          .slice(0, limit);
      } else {
        return allProducts.slice(0, limit);
      }
    } catch (error) {
      console.error('Fallback recommendations error:', error);
      return [];
    }
  }

  private async getCachedRecommendations(request: RecommendationRequest): Promise<RecommendationCache | null> {
    const cacheKey = this.generateCacheKey(request);
    
    const { data: cached } = await this.supabase
      .from('recommendation_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();
    
    return cached;
  }

  private async cacheRecommendations(
    request: RecommendationRequest,
    products: IntegratedProduct[],
    metadata: RecommendationMetadata
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    const expiresAt = new Date(Date.now() + this.config.cache.defaultTTL * 1000);
    
    await this.supabase
      .from('recommendation_cache')
      .upsert({
        cache_key: cacheKey,
        user_id: request.userId,
        session_id: request.sessionId,
        product_id: request.productId,
        recommendation_type: request.type,
        recommended_products: products,
        metadata,
        expires_at: expiresAt.toISOString()
      });
  }

  private generateCacheKey(request: RecommendationRequest): string {
    const parts = [
      request.type,
      request.userId || 'anon',
      request.sessionId || 'no-session',
      request.productId || 'no-product',
      request.category || 'all',
      request.limit || 6,
      JSON.stringify(request.priceRange || {}),
      JSON.stringify(request.excludeProductIds || [])
    ];
    
    return parts.join('|');
  }

  private isCacheExpired(cached: RecommendationCache): boolean {
    return new Date(cached.expiresAt) < new Date();
  }

  private formatResponse(
    products: IntegratedProduct[],
    metadata: RecommendationMetadata,
    cached: boolean
  ): RecommendationResponse {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.config.cache.defaultTTL * 1000).toISOString();
    
    return {
      products,
      algorithm: metadata.algorithm,
      confidence: metadata.confidence,
      cached,
      generatedAt: now,
      expiresAt,
      metadata
    };
  }

  /**
   * Tracking methods
   */
  
  async trackProductView(data: {
    userId?: string;
    sessionId?: string;
    productId: string;
    source: string;
    duration?: number;
    referrerProductId?: string;
  }): Promise<void> {
    await this.supabase
      .from('user_product_views')
      .insert({
        user_id: data.userId,
        session_id: data.sessionId,
        product_id: data.productId,
        source: data.source,
        view_duration: data.duration || 0,
        referrer_product_id: data.referrerProductId
      });
  }

  async trackInteraction(data: {
    userId?: string;
    sessionId?: string;
    productId: string;
    interactionType: string;
    interactionData?: Record<string, any>;
  }): Promise<void> {
    await this.supabase
      .from('user_product_interactions')
      .insert({
        user_id: data.userId,
        session_id: data.sessionId,
        product_id: data.productId,
        interaction_type: data.interactionType,
        interaction_data: data.interactionData || {}
      });
  }
}