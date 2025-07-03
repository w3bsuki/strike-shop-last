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

  const handleQuickView = () => {
    openQuickView(product.slug);
  };

  return (
    <article className={`group relative ${className}`}>
      <Link href={`/products/${product.slug}`} onClick={handleQuickView} className="block">
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
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          
          {/* Add to Cart on Hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={handleAddToCart}
              disabled={product.soldOut}
              className="w-full bg-black text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-4 w-4 inline mr-2" />
              {product.soldOut ? 'SOLD OUT' : 'ADD TO CART'}
            </button>
          </div>
        </div>
        
        <div className="mt-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
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
        </div>
      </Link>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';