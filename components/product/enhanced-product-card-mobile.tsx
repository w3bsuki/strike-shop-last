'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { ProductImage } from '@/components/ui/optimized-image';
import { useIsWishlisted, useWishlistActions } from '@/lib/stores';
import type { WishlistItem } from '@/lib/wishlist-store';
import { useQuickView } from '@/contexts/QuickViewContext';
import { useAria, AccessibleButton } from '@/components/accessibility/aria-helpers';
import { useCart } from '@/hooks/use-cart';
import type { IntegratedProduct } from '@/types/integrated';
import { toast } from '@/hooks/use-toast';
import type { SimpleProduct } from './types';
import { MobileTouchTarget } from '@/components/mobile/utilities/mobile-touch-target';
import { cn } from '@/lib/utils';

/**
 * Enhanced Mobile Product Card Component
 * 
 * Optimized for touch interactions with:
 * - Proper touch target sizing (48px minimum)
 * - Enhanced touch feedback
 * - Improved scroll interaction handling
 * - Better spacing between interactive elements
 * - Optimized for mobile performance
 */

interface EnhancedMobileProductCardProps {
  /** Product data - supports both simple and integrated formats */
  product: SimpleProduct | IntegratedProduct;
  /** Optional CSS class names */
  className?: string;
  /** Whether to prioritize image loading */
  priority?: boolean;
  /** Enhanced mobile interactions */
  enableTouchFeedback?: boolean;
  /** Show actions on mobile (always visible) */
  showMobileActions?: boolean;
}

/**
 * Type guard to check if product is in integrated format
 */
function isIntegratedProduct(product: SimpleProduct | IntegratedProduct): product is IntegratedProduct {
  return 'content' in product && 'pricing' in product && 'badges' in product;
}

/**
 * Normalize product data from different formats into a simple format
 */
function normalizeProduct(product: SimpleProduct | IntegratedProduct): SimpleProduct {
  if (!isIntegratedProduct(product)) {
    return product;
  }

  const { content, pricing, badges } = product;
  const mainImage = content.images?.[0];
  
  return {
    id: product.id,
    name: content.name,
    price: pricing.displayPrice,
    image: typeof mainImage === 'string'
      ? mainImage
      : mainImage && 'asset' in mainImage && mainImage.asset && 'url' in mainImage.asset
        ? (mainImage.asset as any).url as string
        : mainImage && 'url' in mainImage
          ? (mainImage as any).url as string
          : '/placeholder.svg',
    slug: product.slug,
    ...(pricing.displaySalePrice && { originalPrice: pricing.displaySalePrice }),
    ...(badges.isSale && pricing.discount && { discount: `-${pricing.discount.percentage}%` }),
    ...(badges.isNew && { isNew: badges.isNew }),
    ...(badges.isSoldOut && { soldOut: badges.isSoldOut }),
    ...(content.categories?.length && { colors: content.categories.length })
  };
}

const EnhancedMobileProductCardComponent = React.memo(({ 
  product: rawProduct, 
  className = '', 
  priority = false,
  showMobileActions = true
}: EnhancedMobileProductCardProps) => {
  // Normalize product data
  const product = normalizeProduct(rawProduct);
  
  // Hooks
  const isWishlisted = useIsWishlisted(product.id);
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { openQuickView } = useQuickView();
  const { announceToScreenReader } = useAria();
  const { addItem, isAddingItem } = useCart();
  
  // Touch interaction state
  const [isPressed, setIsPressed] = useState(false);

  // Wishlist item for add operation
  const wishlistItem: WishlistItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    slug: product.slug,
  };

  // Enhanced touch event handlers
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Action event handlers with enhanced touch handling
  const handleWishlistToggle = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Enhanced haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(isWishlisted ? [50] : [100, 50, 100]);
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      announceToScreenReader(`${product.name} removed from wishlist`, 'polite');
    } else {
      addToWishlist(wishlistItem);
      announceToScreenReader(`${product.name} added to wishlist`, 'polite');
    }
  }, [isWishlisted, product, wishlistItem, addToWishlist, removeFromWishlist, announceToScreenReader]);

  const handleQuickView = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    openQuickView(product.id);
    announceToScreenReader(`Quick view opened for ${product.name}`, 'polite');
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }, [product, openQuickView, announceToScreenReader]);

  const handleAddToCart = useCallback(async (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product has a variantId
    let variantId: string | null = 'variantId' in product && (product as any).variantId 
      ? (product as any).variantId 
      : null;
    
    try {
      if (!variantId) {
        announceToScreenReader(`Unable to add ${product.name} to cart - variant information missing`, 'assertive');
        toast({
          title: 'Error',
          description: 'Unable to add item to cart. Please try from the product page.',
          variant: 'destructive',
        });
        return;
      }
      
      await addItem({
        productId: product.id,
        variantId: variantId,
        quantity: 1
      });
      
      announceToScreenReader(`${product.name} added to cart`, 'polite');
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
      
      // Success haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      announceToScreenReader(`Failed to add ${product.name} to cart`, 'assertive');
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
      
      // Error haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [product, addItem, announceToScreenReader]);

  // Generate product description for screen readers
  const productDescription = [
    product.name,
    product.discount && `on sale with ${product.discount} discount`,
    product.isNew && 'new arrival',
    product.soldOut && 'currently sold out',
    product.originalPrice 
      ? `was ${product.originalPrice}, now ${product.price}`
      : `priced at ${product.price}`,
    product.colors && `available in ${product.colors} colors`,
  ].filter(Boolean).join(', ');

  return (
    <article 
      className={cn(
        'product-card group relative',
        'transform transition-all duration-200 ease-out',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        'select-none',
        // Remove touch-feedback to prevent scroll interference
        isPressed && 'scale-[0.98]',
        className
      )}
      role="group"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-description-${product.id}`}
      style={{ 
        touchAction: 'pan-y', // Allow vertical scrolling
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        minHeight: '320px' // Prevent layout shift
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Screen reader description */}
      <div id={`product-description-${product.id}`} className="sr-only">
        {productDescription}
      </div>

      {/* Image container with optimized aspect ratio */}
      <div className="relative bg-gray-100 aspect-[3/4] overflow-hidden">
        <ProductImage
          src={product.image || '/placeholder.svg'}
          alt={`${product.name}${product.soldOut ? ' - sold out' : ''}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />

        {/* Product badges */}
        {product.discount && (
          <div 
            className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 z-10"
            role="status" 
            aria-label={`${product.discount} discount`}
          >
            {product.discount}
          </div>
        )}
        {product.isNew && !product.discount && (
          <div 
            className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 z-10"
            role="status" 
            aria-label="New product"
          >
            NEW
          </div>
        )}
        {product.soldOut && (
          <div 
            className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 z-10"
            role="status"
            aria-label="Product is sold out"
          >
            SOLD OUT
          </div>
        )}

        {/* Enhanced Mobile Action Buttons */}
        {showMobileActions && (
          <>
            {/* Wishlist Button - Top Right */}
            <MobileTouchTarget
              size="lg"
              spacing="normal"
              className={cn(
                'absolute top-2 right-2 z-30',
                'bg-white/90 backdrop-blur-sm',
                'transition-all duration-200',
                'hover:bg-white',
                isWishlisted ? 'text-red-500' : 'text-black'
              )}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <AccessibleButton
                className="w-full h-full flex items-center justify-center"
                onClick={handleWishlistToggle}
                pressed={isWishlisted}
                variant="ghost"
                description={`${isWishlisted ? 'Remove from' : 'Add to'} your wishlist for easy access later`}
              >
                <Heart
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isWishlisted && 'fill-red-500 text-red-500'
                  )}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  {isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                </span>
              </AccessibleButton>
            </MobileTouchTarget>

            {/* Action Buttons - Bottom Center */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-touch-gap z-20">
              {/* Quick View Button */}
              <MobileTouchTarget
                size="lg"
                spacing="tight"
                className="bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black"
                onTouchStart={() => {
                  // Don't stop propagation to allow scroll
                }}
              >
                <AccessibleButton
                  className="w-full h-full flex items-center justify-center"
                  onClick={handleQuickView}
                  variant="ghost"
                  description={`Opens a quick preview of ${product.name} in a modal dialog`}
                >
                  <Eye className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Quick view {product.name}</span>
                </AccessibleButton>
              </MobileTouchTarget>

              {/* Add to Cart Button */}
              <MobileTouchTarget
                size="lg"
                spacing="tight"
                className={cn(
                  'bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black',
                  (isAddingItem || product.soldOut) && 'opacity-50'
                )}
                onTouchStart={() => {
                  // Don't stop propagation to allow scroll
                }}
              >
                <AccessibleButton
                  className="w-full h-full flex items-center justify-center"
                  onClick={handleAddToCart}
                  disabled={isAddingItem || product.soldOut}
                  variant="ghost"
                  description={`Add ${product.name} to your shopping cart`}
                >
                  <ShoppingBag 
                    className={cn(
                      'h-5 w-5',
                      isAddingItem && 'animate-pulse'
                    )} 
                    aria-hidden="true" 
                  />
                  <span className="sr-only">Add {product.name} to cart</span>
                </AccessibleButton>
              </MobileTouchTarget>
            </div>
          </>
        )}
      </div>

      {/* Product info with enhanced touch handling */}
      <div className="pt-3 pb-1 px-1" style={{ minHeight: '5rem' }}>
        <Link 
          href={`/product/${product.slug}`} 
          className="block focus:outline-2 focus:outline-offset-2 focus:outline-primary touch-manipulation"
          aria-describedby={`product-description-${product.id}`}
          style={{
            touchAction: 'manipulation',
            minHeight: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <h3 
            id={`product-title-${product.id}`} 
            className="font-typewriter text-sm font-medium mb-1 line-clamp-2 leading-tight"
          >
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2" role="group" aria-label="Product pricing">
            <span 
              className="font-typewriter font-bold text-sm" 
              aria-label={`Current price ${product.price}`}
            >
              {product.price}
            </span>
            {product.originalPrice && (
              <span 
                className="font-typewriter text-xs text-gray-500 line-through"
                aria-label={`Original price ${product.originalPrice}`}
              >
                {product.originalPrice}
              </span>
            )}
          </div>
          {product.colors && (
            <div className="text-xs text-gray-500 mt-1 font-typewriter">
              <span aria-label={`Available in ${product.colors} different colors`}>
                {product.colors} Colors
              </span>
            </div>
          )}
        </Link>
      </div>
    </article>
  );
});

EnhancedMobileProductCardComponent.displayName = 'EnhancedMobileProductCard';

export const EnhancedMobileProductCard = EnhancedMobileProductCardComponent;