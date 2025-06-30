'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore, type WishlistItem } from '@/lib/wishlist-store';
import { createProductId, createVariantId, createQuantity } from '@/types/branded';
import { useMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { SizeGuideModal } from '@/components/size-guide-modal';
import { ProductImageGallery } from './product-image-gallery';
import { ProductDetails } from './product-details';
import { ProductActions } from './product-actions';

type Product = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  soldOut?: boolean;
  slug: string;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: Array<{
    id: string;
    title: string;
    sku?: string;
    prices?: any[];
  }>;
};

export interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose,
}: ProductQuickViewProps) {
  const isMobile = useMobile();

  if (isMobile === true) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[85vh] flex flex-col bg-white">
          <VisuallyHidden>
            <DialogTitle>Product Quick View - {product?.name || 'Loading'}</DialogTitle>
            <DialogDescription>View product details and add to cart</DialogDescription>
          </VisuallyHidden>
          {/* Drawer Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />

          {/* Mobile Optimized Content */}
          {product && (
            <MobileQuickViewContent product={product} onClose={onClose} />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full h-[85vh] min-h-[600px] p-0 gap-0 overflow-hidden" aria-describedby="product-quick-view-description">
        <VisuallyHidden>
          <DialogTitle>Product Quick View - {product?.name || 'Loading'}</DialogTitle>
          <DialogDescription id="product-quick-view-description">
            View product details for {product?.name || 'product'} and add to cart
          </DialogDescription>
        </VisuallyHidden>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white h-11 w-11 touch-manipulation"
          aria-label="Close quick view"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
        {product && <QuickViewContent product={product} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewContent({
  product,
  onClose,
  isMobile = false,
}: {
  product: Product;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } =
    useWishlistStore();

  const [isProductWishlisted, setIsProductWishlisted] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
    setIsSizeGuideOpen(false);
  }, [product?.id]);

  useEffect(() => {
    if (product && isInWishlist) {
      setIsProductWishlisted(isInWishlist(product.id));
    }
  }, [product, isInWishlist, wishlist]);

  if (!product) return null;

  const productImages = product.images || [product.image];
  const sizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL'];

  const handleAddToCart = async () => {
    if (!selectedSize || product.soldOut || isAdded) return;

    // Find the actual variant ID based on the selected size
    let variantId: string | null = null;

    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => {
        return v.title.toLowerCase().includes(selectedSize.toLowerCase());
      });

      if (variant) {
        variantId = variant.id;
      } else if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant) {
          variantId = firstVariant.id;
        }
      }
    }

    if (!variantId) {
      return;
    }

    try {
      await addItem(createProductId(product.id), createVariantId(variantId), createQuantity(quantity));

      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
        setTimeout(() => {
          openCart();
        }, 100);
      }, 1500);
    } catch (error) {
      setIsAdded(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!product || !addToWishlist || !removeFromWishlist || !isInWishlist)
      return;

    const wishlistItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    };

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(wishlistItem);
    }

    setIsProductWishlisted(!isProductWishlisted);
  };

  return (
    <>
      <div
        className={
          isMobile
            ? 'flex flex-col h-full overflow-hidden'
            : 'grid grid-cols-1 lg:grid-cols-2 h-full'
        }
      >
        {/* Product Images */}
        {isMobile ? (
          <div className="w-full h-[40vh] min-h-[300px] flex-shrink-0">
            <ProductImageGallery
              images={productImages}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              productName={product.name}
              badges={{
                ...(product.discount && { discount: product.discount }),
                ...(product.isNew && { isNew: product.isNew }),
                ...(product.soldOut && { soldOut: product.soldOut }),
              }}
            />
          </div>
        ) : (
          <ProductImageGallery
            images={productImages}
            currentIndex={currentImageIndex}
            onIndexChange={setCurrentImageIndex}
            productName={product.name}
            badges={{
              ...(product.discount && { discount: product.discount }),
              ...(product.isNew && { isNew: product.isNew }),
              ...(product.soldOut && { soldOut: product.soldOut }),
            }}
          />
        )}

        {/* Product Details & Actions */}
        <div
          className={
            isMobile
              ? 'flex-1 flex flex-col min-h-0 overflow-hidden'
              : 'flex flex-col h-full min-h-0'
          }
        >
          <div
            className={
              isMobile
                ? 'flex-1 overflow-y-auto p-4 pb-20'
                : 'flex-1 p-6 lg:p-8 overflow-y-auto min-h-0'
            }
          >
            <ProductDetails
              product={product}
              isWishlisted={isProductWishlisted}
              onWishlistToggle={handleWishlistToggle}
            />

            <ProductActions
              sizes={sizes}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              isAdded={isAdded}
              isSoldOut={product.soldOut || false}
              onSizeGuideOpen={() => setIsSizeGuideOpen(true)}
            />

            {/* Mobile Footer Link */}
            {isMobile && (
              <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="text-[10px] underline hover:no-underline uppercase tracking-wider text-center block mt-6"
              >
                View Full Product Details
              </Link>
            )}
          </div>

          {/* Desktop Footer */}
          {!isMobile && (
            <div className="border-t p-4 lg:p-6">
              <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="text-[10px] underline hover:no-underline uppercase tracking-wider text-center block"
              >
                View Full Product Details
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </>
  );
}

// Mobile-optimized quick view component
function MobileQuickViewContent({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } =
    useWishlistStore();

  const isWishlisted = isInWishlist ? isInWishlist(product.id) : false;
  const productImages = product.images || [product.image];
  const sizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL'];

  const handleAddToCart = async () => {
    if (!selectedSize || product.soldOut || isAdded) return;

    // Find variant ID
    let variantId: string | null = null;
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) =>
        v.title.toLowerCase().includes(selectedSize.toLowerCase())
      );
      if (variant) {
        variantId = variant.id;
      } else if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant) {
          variantId = firstVariant.id;
        }
      }
    }

    if (!variantId) return;

    try {
      await addItem(createProductId(product.id), createVariantId(variantId), createQuantity(1)); // Always quantity 1 for quick add
      setIsAdded(true);

      // Quick haptic feedback simulation
      if (navigator.vibrate) navigator.vibrate(100);

      setTimeout(() => {
        onClose();
        openCart();
      }, 800);
    } catch (error) {
      setIsAdded(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;

    const wishlistItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    };

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(wishlistItem);
    }

    // Quick haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStart(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchEnd(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < productImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Image Carousel - 40% height */}
      <div className="relative h-[40%] bg-gray-50 flex-shrink-0">
        <div
          className="relative h-full w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={productImages[currentImageIndex] || product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />

          {/* Image dots indicator */}
          {productImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-all touch-manipulation ${
                    idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          {product.discount && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 text-xs font-bold">
              {product.discount}
            </div>
          )}
          {product.isNew && !product.discount && (
            <div className="absolute top-3 left-3 bg-black text-white px-2 py-1 text-xs font-bold">
              NEW
            </div>
          )}
        </div>
      </div>

      {/* Product Info - 60% height */}
      <div className="flex-1 flex flex-col p-5 pb-4">
        {/* Header: Name and Price */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold leading-tight mb-2 line-clamp-2">
            {product.name}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{product.price}</span>
            {product.originalPrice && (
              <span className="text-base text-gray-500 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Size Selector */}
        {!product.soldOut && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">Select Size</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  role="radio"
                  aria-checked={selectedSize === size}
                  aria-label={`Size ${size}`}
                  className={`h-12 px-4 text-sm font-medium border-2 rounded-lg transition-all touch-manipulation ${
                    selectedSize === size
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-gray-400 active:scale-95'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleWishlistToggle}
              className={`h-14 w-14 flex items-center justify-center border-2 rounded-xl transition-all flex-shrink-0 touch-manipulation active:scale-95 ${
                isWishlisted
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              aria-label={
                isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
              }
            >
              <Heart
                className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`}
              />
            </button>

            <Button
              onClick={handleAddToCart}
              disabled={!selectedSize || product.soldOut || isAdded}
              className="flex-1 h-14 text-base font-semibold bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all touch-manipulation active:scale-95"
            >
              {isAdded ? (
                <span className="flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  Added!
                </span>
              ) : product.soldOut ? (
                'Sold Out'
              ) : !selectedSize ? (
                'Select Size'
              ) : (
                'Add to Cart'
              )}
            </Button>
          </div>

          {/* View Details Link */}
          <Link
            href={`/product/${product.slug}`}
            onClick={onClose}
            className="block text-center text-sm text-gray-600 underline py-2"
          >
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
}
