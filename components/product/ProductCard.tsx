'use client';

import React from 'react';
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

/**
 * ProductCard Component
 * 
 * A performant, accessible product card component for e-commerce displays.
 * Features wishlist functionality, quick view, and proper accessibility.
 * 
 * @component
 * @example
 * // Simple product format
 * <ProductCard
 *   product={{
 *     id: "123",
 *     name: "Product Name",
 *     price: "$99.99",
 *     image: "/product.jpg",
 *     slug: "product-slug"
 *   }}
 * />
 * 
 * @example
 * // Integrated product format
 * <ProductCard
 *   product={integratedProductObject}
 *   priority={true}
 * />
 */

interface SimpleProduct {
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
}

interface ProductCardProps {
  /** Product data - supports both simple and integrated formats */
  product: SimpleProduct | IntegratedProduct;
  /** Optional CSS class names */
  className?: string;
  /** Whether to prioritize image loading */
  priority?: boolean;
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
    originalPrice: pricing.displaySalePrice,
    discount: badges.isSale && pricing.discount 
      ? `-${pricing.discount.percentage}%` 
      : undefined,
    image: typeof mainImage === 'string'
      ? mainImage
      : mainImage?.asset && 'url' in mainImage.asset
        ? mainImage.asset.url
        : '/placeholder.svg',
    slug: product.slug,
    isNew: badges.isNew,
    soldOut: badges.isSoldOut,
    colors: content.categories?.length || undefined,
  };
}

export const ProductCard = React.memo(({ 
  product: rawProduct, 
  className = '', 
  priority = false 
}: ProductCardProps) => {
  // Normalize product data
  const product = normalizeProduct(rawProduct);
  
  // Hooks
  const isWishlisted = useIsWishlisted(product.id);
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { openQuickView } = useQuickView();
  const { announceToScreenReader } = useAria();
  const { addItem, isAddingItem } = useCart();

  // Wishlist item for add operation
  const wishlistItem: WishlistItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    slug: product.slug,
  };

  // Event handlers
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(isWishlisted ? 50 : [100, 50, 100]);
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      announceToScreenReader(`${product.name} removed from wishlist`, 'polite');
    } else {
      addToWishlist(wishlistItem);
      announceToScreenReader(`${product.name} added to wishlist`, 'polite');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
    announceToScreenReader(`Quick view opened for ${product.name}`, 'polite');
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product has a variantId (from product data) or fetch it
    let variantId = 'variantId' in product && product.variantId 
      ? product.variantId 
      : null;
    
    try {
      // If we don't have a variant ID, we need to fetch the product details
      if (!variantId) {
        // For real Medusa products, we should have the variant ID
        // If not, we can't add to cart
        announceToScreenReader(`Unable to add ${product.name} to cart - variant information missing`, 'assertive');
        toast({
          title: 'Error',
          description: 'Unable to add item to cart. Please try from the product page.',
          variant: 'destructive',
        });
        return;
      }
      
      // Real product - call the actual addItem function
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
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      announceToScreenReader(`Failed to add ${product.name} to cart`, 'assertive');
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
      className={`product-card group ${className} transform transition-transform hover:scale-[1.02] active:scale-[0.98] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 touch-manipulation`}
      role="group"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-description-${product.id}`}
    >
      {/* Screen reader description */}
      <div id={`product-description-${product.id}`} className="sr-only">
        {productDescription}
      </div>

      {/* Image container with Tailwind aspect ratio */}
      <div className="product-card-image-wrapper relative bg-gray-100 aspect-[3/4] overflow-hidden rounded-lg">
        <ProductImage
          src={product.image || '/placeholder.svg'}
          alt={`${product.name}${product.soldOut ? ' - sold out' : ''}`}
          className="product-card-image absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
          sizes="(max-width: 640px) 176px, (max-width: 768px) 192px, (max-width: 1024px) 208px, 240px"
        />

        {/* Badges */}
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

        {/* Action Buttons - Bottom Center */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-3 opacity-100 transition-all duration-300 z-20">
          {/* Quick View Button */}
          <AccessibleButton
            className="h-11 w-11 flex items-center justify-center bg-black/80 hover:bg-black text-white backdrop-blur-sm border-0 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px]"
            onClick={handleQuickView}
            variant="ghost"
            description={`Opens a quick preview of ${product.name} in a modal dialog`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Quick view {product.name}</span>
          </AccessibleButton>

          {/* Add to Cart Button */}
          <AccessibleButton
            className="h-11 w-11 flex items-center justify-center bg-black/80 hover:bg-black text-white backdrop-blur-sm border-0 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] disabled:opacity-50"
            onClick={handleAddToCart}
            disabled={isAddingItem || product.soldOut}
            variant="ghost"
            description={`Add ${product.name} to your shopping cart`}
          >
            <ShoppingBag className={`h-4 w-4 ${isAddingItem ? 'animate-pulse' : ''}`} aria-hidden="true" />
            <span className="sr-only">Add {product.name} to cart</span>
          </AccessibleButton>
        </div>

        {/* Wishlist Button - Top Right */}
        <AccessibleButton
          className={`absolute top-2 right-2 h-11 w-11 flex items-center justify-center bg-white/80 hover:bg-white/90 backdrop-blur-sm border-0 touch-manipulation z-30 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px] rounded-full ${
            isWishlisted ? 'text-red-500' : 'text-black'
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

      {/* Product info */}
      <div className="product-card-content" style={{ minHeight: '4.5rem' }}>
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
});

ProductCard.displayName = 'ProductCard';