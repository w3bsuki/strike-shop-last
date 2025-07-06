'use client';

import { memo, useState, useCallback } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useWishlistItems, useWishlistActions, useIsWishlisted, useCartActions } from '@/lib/stores';
import { BaseProduct, SimpleProduct } from './types';
import { useQuickView } from '@/contexts/QuickViewContext';
import { createProductId, createVariantId, createPrice, createSlug, createImageURL } from '@/types/branded';

interface ProductCardProps {
  product: BaseProduct | SimpleProduct;
  priority?: boolean;
  className?: string;
}

export const ProductCard = memo(function ProductCard({ 
  product, 
  priority = false,
  className 
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { addItem } = useCartActions();
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const isInWishlist = useIsWishlisted(product.id);
  const { openQuickView } = useQuickView();

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (product.originalPrice) {
      const original = parseFloat(product.originalPrice.replace(/[^0-9.]/g, ''));
      const current = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      return Math.round(((original - current) / original) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      const productId = createProductId(product.id);
      const variantId = createVariantId(product.variantId || product.variants?.[0]?.id || `variant_${product.id}`);
      
      addToWishlist({
        id: productId,
        productId: productId,
        variantId: variantId,
        name: product.name || product.title || 'Product',
        slug: createSlug(product.slug),
        image: product.image ? createImageURL(product.image) : null,
        price: createPrice(parseFloat(product.price.replace(/[^0-9.-]+/g, '')) || 0),
        displayPrice: product.price,
        addedAt: new Date()
      });
    }
  }, [product, isInWishlist, addToWishlist, removeFromWishlist]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.soldOut || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      const variantId = product.variantId || product.variants?.[0]?.id || `variant_${product.id}`;
      await addItem(
        product.id,
        variantId,
        1,
        {
          name: product.name || product.title,
          price: product.price,
          image: product.image,
          size: product.variants?.[0]?.title || 'Default'
        }
      );
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, addItem, isAddingToCart]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product.id);
  }, [product.id, openQuickView]);

  return (
    <article 
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href={`/products/${product.slug || product.id}`}
        className="block"
      >
        {/* Image Container - Gymshark Style */}
        <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
          <Image
            src={imageError ? '/placeholder-product.jpg' : product.image}
            alt={product.name || product.title || 'Product'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImageError(true)}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Second Image on Hover (if available) */}
          {product.images?.[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.name || product.title} - alternate view`}
              fill
              className={cn(
                "object-cover absolute inset-0 transition-opacity duration-500",
                isHovered ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          
          {/* Minimal Badges */}
          {discount > 0 && !product.soldOut && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1">
              {discount}% OFF
            </span>
          )}
          {product.soldOut && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-2 py-1">
              SOLD OUT
            </span>
          )}
          
          {/* Wishlist Button - Minimal */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-colors",
                isInWishlist ? "fill-black text-black" : "text-white"
              )}
              strokeWidth={2}
            />
          </button>
          
          {/* Quick Add Button - Appears on Hover */}
          {!product.soldOut && (
            <button
              onClick={handleAddToCart}
              className={cn(
                "absolute bottom-0 left-0 right-0 bg-black text-white py-3 text-sm font-medium uppercase tracking-wide",
                "transform transition-all duration-300",
                isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                showSuccess && "bg-green-600"
              )}
              disabled={isAddingToCart}
            >
              {showSuccess ? "ADDED" : isAddingToCart ? "ADDING..." : "QUICK ADD"}
            </button>
          )}
        </div>
        
        {/* Product Info - Minimal Gymshark Style */}
        <div className="pt-3 pb-2">
          {/* Product Name */}
          <h3 className="text-sm font-medium text-black mb-1">
            {product.name || product.title}
          </h3>
          
          {/* Color Count */}
          {product.colors && product.colors > 1 && (
            <p className="text-xs text-gray-600 mb-2">
              {product.colors} colours
            </p>
          )}
          
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-black">
              {product.price}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xs text-gray-500 line-through">
                  {product.originalPrice}
                </span>
                <span className="text-xs text-red-600 font-medium">
                  {discount}% off
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';