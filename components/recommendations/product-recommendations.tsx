'use client';

// Product Recommendations Component
// Displays personalized product recommendations using the recommendation engine

import { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '@/components/product/product-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegratedProduct } from '@/types/integrated';
import type { SimpleProduct } from '@/components/product/types';
import type { RecommendationType, RecommendationResponse } from '@/types/recommendations';

// Transform IntegratedProduct to SimpleProduct for ProductCard compatibility
const transformToSimpleProduct = (product: IntegratedProduct): SimpleProduct => {
  const mainImageUrl = product.content?.images?.[0]?.url || '/placeholder.svg?height=400&width=400';
  const basePrice = product.pricing?.basePrice || 0;
  const salePrice = product.pricing?.salePrice;
  
  return {
    id: product.id,
    name: product.content?.name || 'Unnamed Product',
    price: `€${basePrice}`,
    originalPrice: salePrice ? `€${basePrice}` : undefined,
    discount: salePrice ? `-${Math.round(((basePrice - salePrice) / basePrice) * 100)}%` : undefined,
    image: mainImageUrl,
    slug: product.slug,
    isNew: product.badges?.isNew || false,
    soldOut: product.badges?.isSoldOut || false,
    colors: product.commerce?.variants?.length || 1,
  };
};

interface ProductRecommendationsProps {
  type: RecommendationType;
  productId?: string;
  userId?: string;
  sessionId?: string;
  title: string;
  subtitle?: string;
  limit?: number;
  category?: string;
  priceRange?: { min?: number; max?: number };
  excludeProductIds?: string[];
  className?: string;
  showRefresh?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // minutes
  layout?: 'grid' | 'carousel';
  priority?: boolean;
  onProductClick?: (product: IntegratedProduct) => void;
  onRecommendationLoad?: (recommendations: RecommendationResponse) => void;
  emptyState?: React.ReactNode;
}

export function ProductRecommendations({
  type,
  productId,
  userId,
  sessionId,
  title,
  subtitle,
  limit = 6,
  category,
  priceRange,
  excludeProductIds = [],
  className = '',
  showRefresh = false,
  autoRefresh = false,
  refreshInterval = 30,
  layout = 'grid',
  priority = false,
  onProductClick,
  onRecommendationLoad,
  emptyState
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<IntegratedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerSlide = layout === 'carousel' ? Math.min(4, limit) : limit;
  const totalSlides = Math.ceil(recommendations.length / itemsPerSlide);

  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);

      const requestBody = {
        type,
        productId,
        userId,
        sessionId,
        limit,
        category,
        priceRange,
        excludeProductIds
      };

      console.log('Fetching recommendations:', requestBody);

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }

      if (result.success) {
        setRecommendations(result.data.products || []);
        setMetadata(result.data.metadata);
        setLastUpdated(new Date());
        
        // Call callback if provided
        if (onRecommendationLoad) {
          onRecommendationLoad(result.data);
        }

        console.log('Recommendations loaded:', {
          type,
          count: result.data.products?.length || 0,
          cached: result.data.cached,
          confidence: result.data.confidence
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(errorMessage);
      console.error('Recommendation fetch error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [
    type, productId, userId, sessionId, limit, category, 
    priceRange, excludeProductIds, onRecommendationLoad
  ]);

  // Initial load
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchRecommendations(true);
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRecommendations]);

  // Handle product click with tracking
  const handleProductClick = useCallback(async (product: IntegratedProduct) => {
    try {
      // Track recommendation click
      await fetch('/api/tracking/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          productId: product.id,
          interactionType: 'view',
          interactionData: {
            source: 'recommendation',
            recommendationType: type,
            sourceProductId: productId,
            algorithm: metadata?.algorithm,
            confidence: metadata?.confidence
          },
          productName: product.content?.name,
          category: product.content?.categories?.[0]?.name,
          price: product.pricing?.basePrice,
          brand: product.content?.brand
        })
      });

      // Call custom handler if provided
      if (onProductClick) {
        onProductClick(product);
      }
    } catch (error) {
      console.error('Failed to track recommendation click:', error);
      // Still call custom handler even if tracking fails
      if (onProductClick) {
        onProductClick(product);
      }
    }
  }, [userId, sessionId, type, productId, metadata, onProductClick]);

  // Carousel navigation
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-advance carousel
  useEffect(() => {
    if (layout !== 'carousel' || totalSlides <= 1) return;

    const interval = setInterval(nextSlide, 8000); // 8 seconds
    return () => clearInterval(interval);
  }, [layout, totalSlides, nextSlide]);

  // Reset carousel when recommendations change
  useEffect(() => {
    setCurrentSlide(0);
  }, [recommendations]);

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <section className={cn('py-8', className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-1" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error && recommendations.length === 0) {
    return (
      <section className={cn('py-8', className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
              Retry
            </Button>
          )}
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load recommendations</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (recommendations.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return null; // Don't show empty recommendation sections
  }

  const visibleProducts = layout === 'carousel' 
    ? recommendations.slice(currentSlide * itemsPerSlide, (currentSlide + 1) * itemsPerSlide)
    : recommendations;

  return (
    <section className={cn('py-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          {metadata && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>Algorithm: {metadata.algorithm}</span>
              <span>•</span>
              <span>Confidence: {Math.round(metadata.confidence * 100)}%</span>
              {metadata.cached && (
                <>
                  <span>•</span>
                  <span>Cached</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          )}
          
          {layout === 'carousel' && totalSlides > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500 px-2">
                {currentSlide + 1} / {totalSlides}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid/Carousel */}
      <div className={cn(
        layout === 'carousel' 
          ? 'overflow-hidden' 
          : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
      )}>
        {layout === 'carousel' ? (
          <div 
            className="flex transition-transform duration-500 ease-in-out gap-4"
            style={{ 
              transform: `translateX(-${currentSlide * 100}%)`,
              width: `${totalSlides * 100}%`
            }}
          >
            {recommendations.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0"
                style={{ width: `${100 / (totalSlides * itemsPerSlide)}%` }}
              >
                <ProductCard
                  product={transformToSimpleProduct(product)}
                  priority={priority}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={transformToSimpleProduct(product)}
              priority={priority}
            />
          ))
        )}
      </div>

      {/* Carousel Indicators */}
      {layout === 'carousel' && totalSlides > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === currentSlide ? 'bg-gray-900' : 'bg-gray-300'
              )}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}