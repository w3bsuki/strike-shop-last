'use client';

import { memo, useState, useCallback } from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlistActions, useIsWishlisted } from '@/lib/stores';
import { BaseProduct, SimpleProduct } from './types';
import { useQuickView } from '@/contexts/QuickViewContext';
import { createProductId, createVariantId, createPrice, createSlug, createImageURL } from '@/types/branded';
import { ColorSwatches } from './color-swatches';

interface ProductCardProps {
  product: BaseProduct | SimpleProduct;
  priority?: boolean;
  className?: string;
  variant?: 'default' | 'detailed';
}

export const ProductCard = memo(function ProductCard({ 
  product, 
  priority = false,
  className,
  variant = 'default'
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const isInWishlist = useIsWishlisted(product.id);
  const { openQuickView } = useQuickView();
  
  // Get available images for cycling
  const availableImages = [
    product.image,
    ...(product.images || [])
  ].filter(Boolean);

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
        title: product.name || product.title || 'Product',
        image: product.image ? createImageURL(product.image) || undefined : undefined,
        price: parseFloat(product.price.replace(/[^0-9.-]+/g, '')) || 0,
        addedAt: Date.now()
      });
    }
  }, [product, isInWishlist, addToWishlist, removeFromWishlist]);

  const handleImageCycle = useCallback(() => {
    if (availableImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % availableImages.length);
    }
  }, [availableImages.length]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product.id);
  }, [product.id, openQuickView]);

  return (
    <div 
      className={cn(
        "group relative bg-white overflow-hidden transition-all duration-300 hover:shadow-xl",
        "border border-gray-100 hover:border-gray-200 rounded-none",
        className
      )}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {/* Image Container - Bigger */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        <Link href={`/products/${product.slug || product.id}`}>
          <Image
            src={imageError ? '/placeholder-product.jpg' : (availableImages[currentImageIndex] || '/placeholder-product.jpg')}
            alt={product.name || product.title || 'Product'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            onError={() => setImageError(true)}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
        
        {/* Image Cycling Dots */}
        {availableImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
            {availableImages.map((_, index) => (
              <button
                key={index}
                onClick={handleImageCycle}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  index === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                )}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {product.isNew && !product.soldOut && (
            <Badge className="bg-black text-white text-xs font-bold px-2 py-1 hover:bg-black">
              NEW
            </Badge>
          )}
          {product.soldOut && (
            <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 hover:bg-red-600">
              SOLD OUT
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 hover:bg-red-600">
              -{discount}%
            </Badge>
          )}
        </div>
        
        
        {/* Quick View Button - appears on hover */}
        {!product.soldOut && (
          <Button
            onClick={handleQuickView}
            className={cn(
              "absolute bottom-3 left-3 right-3 z-10 bg-black text-white hover:bg-gray-800",
              "transition-all duration-200 text-sm font-medium",
              "md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0",
              "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
            )}
          >
            <Eye className="h-4 w-4 mr-2" />
            Quick View
          </Button>
        )}
      </div>
      
      {/* Product Info - Minimal spacing */}
      <div className="relative">
        <div className="p-3 pr-10">
          <Link 
            href={`/products/${product.slug || product.id}`}
            className="hover:text-gray-600 transition-colors"
          >
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-none">
              {product.name || product.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-gray-900">
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
        </div>
        
        {/* Cart and Wishlist Icons - Absolute positioned */}
        <div className="absolute top-3 -right-4 flex items-center gap-0">
          <button
            onClick={handleToggleWishlist}
            className="text-gray-600 hover:text-red-500 transition-colors -mr-5"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              className={cn(
                "h-5 w-5 stroke-[1.5]",
                isInWishlist ? "fill-red-500 text-red-500" : ""
              )}
            />
          </button>
          {!product.soldOut && (
            <button
              onClick={handleQuickView}
              className="text-black hover:text-gray-600 transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            </button>
          )}
        </div>
        
        {/* Color variants (if available) */}
        {variant === 'detailed' && product.colors && product.colors.length > 0 && (
          <ColorSwatches
            colors={product.colors}
            maxDisplay={4}
            size="sm"
            className="mt-1"
          />
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';