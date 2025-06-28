'use client';

import { useQuickView } from '@/contexts/QuickViewContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useIsWishlisted, useWishlistActions } from '@/lib/stores';
import { toast } from '@/hooks/use-toast';

export function QuickViewDialog() {
  const { isOpen, currentProduct, closeQuickView } = useQuickView();
  const { isAddingItem } = useCart();
  const isWishlisted = useIsWishlisted(currentProduct?.id || '');
  const { addToWishlist, removeFromWishlist } = useWishlistActions();

  if (!currentProduct) return null;

  const handleAddToCart = async () => {
    // For now, redirect to product page for size selection
    toast({
      title: 'Select Options',
      description: 'Please visit the product page to select size and add to cart.',
    });
    closeQuickView();
    window.location.href = `/product/${currentProduct.slug}`;
  };

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(currentProduct.id);
      toast({
        title: 'Removed from wishlist',
        description: `${currentProduct.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        slug: currentProduct.slug,
      });
      toast({
        title: 'Added to wishlist',
        description: `${currentProduct.name} has been added to your wishlist.`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeQuickView}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick view: {currentProduct.name}</DialogTitle>
          <DialogDescription>
            Product details and purchase options for {currentProduct.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={currentProduct.image}
              alt={currentProduct.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {currentProduct.discount && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded">
                {currentProduct.discount}
              </div>
            )}
            {currentProduct.isNew && !currentProduct.discount && (
              <div className="absolute top-4 left-4 bg-black text-white text-sm font-bold px-3 py-1 rounded">
                NEW
              </div>
            )}
            {currentProduct.soldOut && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-600 text-white text-lg font-bold px-4 py-2 rounded">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4">
            <div>
              <h2 className="text-2xl font-bold font-typewriter">{currentProduct.name}</h2>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-typewriter">
                  {currentProduct.price}
                </span>
                {currentProduct.originalPrice && (
                  <span className="text-lg text-gray-500 line-through font-typewriter">
                    {currentProduct.originalPrice}
                  </span>
                )}
              </div>
              {currentProduct.colors && (
                <p className="text-sm text-gray-600 mt-1 font-typewriter">
                  Available in {currentProduct.colors} colors
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-gray-700 font-typewriter">
                Experience premium quality with our carefully curated collection. 
                This product combines style and functionality for the modern individual.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={currentProduct.soldOut || isAddingItem}
                className="w-full h-12 bg-black text-white hover:bg-gray-800 font-typewriter"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {currentProduct.soldOut ? 'Sold Out' : 'Select Options'}
              </Button>

              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                className="w-full h-12 font-typewriter"
              >
                <Heart
                  className={`mr-2 h-5 w-5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>

              <Link
                href={`/product/${currentProduct.slug}`}
                className="block w-full"
                onClick={closeQuickView}
              >
                <Button variant="ghost" className="w-full h-12 font-typewriter">
                  View Full Details
                </Button>
              </Link>
            </div>

            <div className="border-t pt-4 space-y-2 text-sm text-gray-600 font-typewriter">
              <p>✓ Free shipping on orders over $100</p>
              <p>✓ 30-day return policy</p>
              <p>✓ Secure checkout with Stripe</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}