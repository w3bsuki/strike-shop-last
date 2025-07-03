'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartActions } from '@/lib/stores';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useQuickView } from '@/contexts/QuickViewContext';
import { Heart, ShoppingBag } from 'lucide-react';
import type { SimpleProduct } from './types';

interface ProductCardProps {
  product: SimpleProduct;
  className?: string;
  priority?: boolean;
}

export const ProductCard = React.memo(({ product, className = '', priority = false }: ProductCardProps) => {
  const cartActions = useCartActions();
  const wishlistStore = useWishlistStore();
  const isInWishlist = wishlistStore.isInWishlist(product.id);
  const { openQuickView } = useQuickView();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For SimpleProduct, use productId as both productId and variantId
    // In real Shopify integration, we would need to get actual variant ID
    const variantId = product.id; // Temporary - should be actual variant ID
    
    cartActions.addItem(product.id, variantId, 1, {
      name: product.name,
      price: parseFloat(product.price.replace(/[^0-9.]/g, '')),
      image: product.image,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistStore.toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product.slug);
  };

  return (
    <article className={`group relative touch-pan-y ${className}`} style={{ touchAction: 'pan-y' }}>
      <div className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-lg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Badges */}
          {product.soldOut && (
            <div className="absolute top-2 left-2">
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gray-800 rounded">
                SOLD OUT
              </span>
            </div>
          )}
          {product.isNew && !product.soldOut && (
            <div className="absolute top-2 left-2">
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-black rounded">
                NEW
              </span>
            </div>
          )}
          {product.discount && !product.soldOut && (
            <div className="absolute top-2 left-2">
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-500 rounded">
                -{product.discount}
              </span>
            </div>
          )}
          
          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-3.5 w-3.5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          
          {/* Quick View on Hover (always visible on mobile) */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={handleQuickView}
              className="w-full bg-white/90 backdrop-blur text-black py-2 px-4 rounded-md text-sm font-medium hover:bg-white transition-colors shadow-sm"
            >
              Quick View
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex items-start justify-between gap-2">
          <Link href={`/products/${product.slug}`} className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:underline">
              {product.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
            {product.colors && product.colors > 1 && (
              <p className="mt-1 text-xs text-gray-500">
                {product.colors} colors
              </p>
            )}
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={product.soldOut}
            className="flex-shrink-0 p-1.5 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label={product.soldOut ? 'Sold out' : 'Add to cart'}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';