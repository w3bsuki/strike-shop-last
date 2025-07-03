'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickViewInfoProps {
  product: {
    id: string;
    name: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    description?: string;
    sku?: string;
    colors?: number;
  };
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  className?: string;
}

export function QuickViewInfo({
  product,
  isWishlisted,
  onWishlistToggle,
  className,
}: QuickViewInfoProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{product.name}</h2>
          {product.sku && (
            <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onWishlistToggle}
          className="flex-shrink-0"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'h-5 w-5',
              isWishlisted && 'fill-current text-red-500'
            )}
          />
        </Button>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{product.price}</span>
        {product.originalPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {product.originalPrice}
            </span>
            {product.discount && (
              <span className="text-sm font-semibold text-destructive">
                {product.discount}
              </span>
            )}
          </>
        )}
      </div>

      {/* Colors indicator */}
      {product.colors && product.colors > 0 && (
        <p className="text-sm text-muted-foreground">
          Available in {product.colors} colors
        </p>
      )}

      {/* Description */}
      {product.description && (
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">{product.description}</p>
        </div>
      )}
    </div>
  );
}