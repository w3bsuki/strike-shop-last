'use client';

import { useWishlistItems, useWishlistActions } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function WishlistClient() {
  const items = useWishlistItems();
  const { removeFromWishlist, clearWishlist } = useWishlistActions();

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="strike-container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-typewriter font-bold uppercase tracking-wider">
                Wishlist
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-typewriter">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearWishlist}
                className="text-destructive hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="strike-container py-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-typewriter font-bold uppercase tracking-wider mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-typewriter">
              Save your favorite items to purchase later
            </p>
            <Button asChild>
              <Link href="/collections">
                Continue Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="group">
                <Link href={`/products/${item.slug}`}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <Image
                      src={item.image || '/placeholder.svg'}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWishlist(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
                <div className="mt-3">
                  <Link href={`/products/${item.slug}`}>
                    <h3 className="font-typewriter text-sm font-bold uppercase tracking-wider line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="font-typewriter text-sm font-bold mt-1">
                    {(item as any).displayPrice || '€0.00'}
                  </p>
                  <Button 
                    className="w-full mt-3" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/products/${item.slug}`}>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      View Product
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}