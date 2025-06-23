'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/optimized-image';
import { Heart, Eye } from 'lucide-react';
import { useIsWishlisted, useWishlistActions } from '@/lib/stores';
import type { WishlistItem } from '@/lib/wishlist-store';
import { useQuickView } from '@/contexts/QuickViewContext';
import { usePrefetch } from '@/hooks/use-prefetch';
import { useAria, AccessibleButton } from '@/components/accessibility/aria-helpers';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    image: string;
    slug: string;
    isNew?: boolean;
    soldOut?: boolean;
    colors?: number;
  };
  className?: string;
  priority?: boolean;
}

/**
 * EXTREME PERFORMANCE: Unified Product Card Component
 * Memoized with optimal re-render prevention for FAST AS FUCK performance
 */
const ProductCardComponent = ({
  product,
  className = '',
  priority = false,
}: ProductCardProps) => {
  const isWishlisted = useIsWishlisted(product.id);
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { openQuickView } = useQuickView();
  const { announceToScreenReader } = useAria();

  // PERFORMANCE: Memoize wishlist item to prevent recreation
  const wishlistItem: WishlistItem = useMemo(() => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    slug: product.slug,
  }), [product.id, product.name, product.price, product.image, product.slug]);

  // PERFORMANCE: Memoize event handlers to prevent re-renders
  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Enhanced haptic feedback pattern
    if (navigator.vibrate) {
      if (isWishlisted) {
        navigator.vibrate(50); // Single vibration for remove
      } else {
        navigator.vibrate([100, 50, 100]); // Double vibration for add
      }
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      announceToScreenReader(`${product.name} removed from wishlist`, 'polite');
    } else {
      addToWishlist(wishlistItem);
      announceToScreenReader(`${product.name} added to wishlist`, 'polite');
    }
  }, [isWishlisted, product.id, product.name, removeFromWishlist, addToWishlist, wishlistItem, announceToScreenReader]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
    announceToScreenReader(`Quick view opened for ${product.name}`, 'polite');
  }, [openQuickView, product, announceToScreenReader]);

  // PERFORMANCE: Memoize image source
  const imageSrc = useMemo(() => product.image || '/placeholder.svg', [product.image]);

  // Generate comprehensive product description for screen readers
  const productDescription = useMemo(() => {
    const parts = [product.name];
    
    if (product.discount) {
      parts.push(`on sale with ${product.discount} discount`);
    }
    
    if (product.isNew) {
      parts.push('new arrival');
    }
    
    if (product.soldOut) {
      parts.push('currently sold out');
    }
    
    if (product.originalPrice) {
      parts.push(`was ${product.originalPrice}, now ${product.price}`);
    } else {
      parts.push(`priced at ${product.price}`);
    }
    
    if (product.colors) {
      parts.push(`available in ${product.colors} colors`);
    }
    
    return parts.join(', ');
  }, [product]);

  return (
    <article 
      className={`product-card group ${className} transform transition-transform hover:scale-[1.02] active:scale-[0.98] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 touch-manipulation`}
      role="group"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-description-${product.id}`}
    >
      {/* Screen reader description */}
      <div id={`product-description-${product.id}`} className="sr-only">
        {productDescription}
      </div>

      <div className="product-card-image-wrapper relative">
        <ProductImage
          src={imageSrc}
          alt={`${product.name}${product.soldOut ? ' - sold out' : ''}`}
          className="product-card-image"
          priority={priority}
          sizes="(max-width: 640px) 176px, (max-width: 768px) 192px, (max-width: 1024px) 208px, 240px"
        />

        {/* Badges with proper semantic meaning */}
        {product.discount && (
          <div 
            className="product-card-discount" 
            role="status" 
            aria-label={`${product.discount} discount`}
          >
            {product.discount}
          </div>
        )}
        {product.isNew && !product.discount && (
          <div 
            className="product-card-new" 
            role="status" 
            aria-label="New product"
          >
            NEW
          </div>
        )}
        {product.soldOut && (
          <div 
            className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5"
            role="status"
            aria-label="Product is sold out"
          >
            SOLD OUT
          </div>
        )}

        {/* Quick View Button - Enhanced for accessibility */}
        <AccessibleButton
          className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm p-3 shadow-sm hover:bg-white hover:shadow-md transition-all z-20 lg:opacity-0 lg:group-hover:opacity-100 touch-manipulation min-h-[44px] min-w-[44px]"
          onClick={handleQuickView}
          variant="ghost"
          description={`Opens a quick preview of ${product.name} in a modal dialog`}
        >
          <Eye className="h-4 w-4 text-black" aria-hidden="true" />
          <span className="sr-only">Quick view {product.name}</span>
        </AccessibleButton>

        {/* Wishlist Button - Enhanced for accessibility */}
        <AccessibleButton
          className={`absolute top-2 right-2 h-11 w-11 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white touch-manipulation z-30 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] ${
            isWishlisted ? 'text-red-500 shadow-sm' : 'text-black'
          }`}
          onClick={handleWishlistToggle}
          pressed={isWishlisted}
          variant="ghost"
          description={`${isWishlisted ? 'Remove from' : 'Add to'} your wishlist for easy access later`}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${
              isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-black hover:scale-110'
            }`}
            aria-hidden="true"
          />
          <span className="sr-only">
            {isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          </span>
        </AccessibleButton>
      </div>

      <div className="product-card-content">
        <Link 
          href={`/product/${product.slug}`} 
          className="block focus:outline-2 focus:outline-offset-2 focus:outline-primary rounded-none"
          aria-describedby={`product-description-${product.id}`}
        >
          <h3 id={`product-title-${product.id}`} className="product-card-title font-typewriter">
            {product.name}
          </h3>
          <div className="flex items-baseline" role="group" aria-label="Product pricing">
            <span className="product-card-price font-typewriter font-bold" aria-label={`Current price ${product.price}`}>
              {product.price}
            </span>
            {product.originalPrice && (
              <span 
                className="product-card-original-price font-typewriter"
                aria-label={`Original price ${product.originalPrice}`}
              >
                {product.originalPrice}
              </span>
            )}
          </div>
          {product.colors && (
            <div className="text-[10px] text-[var(--subtle-text-color)] mt-0.5 font-typewriter">
              <span aria-label={`Available in ${product.colors} different colors`}>
                {product.colors} Colors
              </span>
            </div>
          )}
        </Link>
      </div>
    </article>
  );
};

// CRITICAL: Deep memoization with custom comparison for extreme performance
export const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  // Only re-render if essential product data changes
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.image === nextProps.product.image &&
    prevProps.product.isNew === nextProps.product.isNew &&
    prevProps.product.soldOut === nextProps.product.soldOut &&
    prevProps.product.discount === nextProps.product.discount &&
    prevProps.priority === nextProps.priority &&
    prevProps.className === nextProps.className
  );
});
