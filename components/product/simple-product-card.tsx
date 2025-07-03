'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartActions } from '@/lib/stores';
import { useWishlistStore } from '@/lib/stores/wishlist';
import { useQuickView } from '@/contexts/QuickViewContext';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import type { SimpleProduct } from './types';

interface SimpleProductCardProps {
  product: SimpleProduct;
  className?: string;
  priority?: boolean;
}

export function SimpleProductCard({ product, className = '', priority = false }: SimpleProductCardProps) {
  const cartActions = useCartActions();
  const wishlistStore = useWishlistStore();
  const isInWishlist = wishlistStore.isInWishlist(product.id);
  const { openQuickView } = useQuickView();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
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
    openQuickView(product.slug);
  };

  return (
    <article className={`group relative flex flex-col h-full bg-background overflow-hidden rounded-md border border-border hover:border-primary shadow-sm hover:shadow-lg transition-all duration-200 ${className}`}>
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
          
          {/* Badges */}
          {product.soldOut && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gray-800">
                Sold Out
              </span>
            </div>
          )}
          
          {product.isNew && !product.soldOut && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-black">
                New
              </span>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          
          {/* Quick Actions on Hover */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              <Button
                onClick={handleQuickView}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                Quick View
              </Button>
              <Button
                onClick={handleAddToCart}
                size="sm"
                variant="default"
                className="flex-1"
                disabled={product.soldOut}
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4">
          <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-bold">{product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
          {product.colors && product.colors > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              {product.colors} colors available
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}