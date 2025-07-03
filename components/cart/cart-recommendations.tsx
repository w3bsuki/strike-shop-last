'use client';

import { Plus, Star, TrendingUp, Eye, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { CartRecommendation } from '@/lib/stores/slices/enhanced-cart';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface CartRecommendationsProps {
  recommendations: CartRecommendation[];
  onAddToCart: (recommendation: CartRecommendation) => void;
}

const getReasonIcon = (reason: CartRecommendation['reason']) => {
  switch (reason) {
    case 'frequently-bought-together':
      return <ShoppingCart className="h-3 w-3" />;
    case 'similar-products':
      return <Star className="h-3 w-3" />;
    case 'trending':
      return <TrendingUp className="h-3 w-3" />;
    case 'recently-viewed':
      return <Eye className="h-3 w-3" />;
    default:
      return <Star className="h-3 w-3" />;
  }
};

const getReasonLabel = (reason: CartRecommendation['reason']) => {
  switch (reason) {
    case 'frequently-bought-together':
      return 'Often bought together';
    case 'similar-products':
      return 'Similar products';
    case 'trending':
      return 'Trending now';
    case 'recently-viewed':
      return 'Recently viewed';
    default:
      return 'Recommended';
  }
};

const getReasonColor = (reason: CartRecommendation['reason']) => {
  switch (reason) {
    case 'frequently-bought-together':
      return 'bg-blue-100 text-blue-700';
    case 'similar-products':
      return 'bg-purple-100 text-purple-700';
    case 'trending':
      return 'bg-orange-100 text-orange-700';
    case 'recently-viewed':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export function CartRecommendations({ recommendations, onAddToCart }: CartRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recommendations available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-3">
        <h3 className="font-medium text-sm">You might also like</h3>
        
        {recommendations.map((recommendation) => (
          <Card key={`${recommendation.productId}-${recommendation.variantId}`} className="p-4">
            <div className="flex gap-3">
              {/* Product Image */}
              <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                {recommendation.productData?.image ? (
                  <Image
                    src={recommendation.productData.image}
                    alt={recommendation.productData.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Star className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {recommendation.productData?.name || recommendation.name}
                    </h4>
                    
                    <p className="text-sm font-medium text-primary mb-2">
                      {formatPrice(recommendation.productData?.price || 0)}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getReasonColor(recommendation.reason)}`}
                      >
                        {getReasonIcon(recommendation.reason)}
                        <span className="ml-1">{getReasonLabel(recommendation.reason)}</span>
                      </Badge>
                      
                      {recommendation.confidence > 0.8 && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                          <Star className="h-3 w-3 mr-1" />
                          High match
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="sm"
                    onClick={() => onAddToCart(recommendation)}
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Confidence Score Info */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
        <p className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          Recommendations based on your cart items and shopping patterns
        </p>
      </div>
    </div>
  );
}