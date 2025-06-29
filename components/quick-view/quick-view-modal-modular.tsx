'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore, type WishlistItem } from '@/lib/wishlist-store';
import { createProductId, createVariantId, createQuantity } from '@/types/branded';
import { useMobile } from '@/hooks/use-mobile';
import { SizeGuideModal } from '@/components/size-guide-modal';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';

import {
  QuickViewImage,
  QuickViewInfo,
  QuickViewActions,
  QuickViewGallery,
} from './components';

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

export interface QuickViewModalModularProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModalModular({
  product,
  isOpen,
  onClose,
}: QuickViewModalModularProps) {
  const isMobile = useMobile();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  const isWishlisted = product ? isInWishlist(product.id) : false;

  // Reset state when product changes
  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
    setIsSizeGuideOpen(false);
  }, [product?.id]);

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
    if (!product) return;

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
  };

  // Mobile view using Drawer
  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DrawerContent className="h-[85vh] flex flex-col bg-white">
            {/* Drawer Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />

            <div className="flex flex-col h-full overflow-hidden">
              {/* Gallery for mobile */}
              <div className="w-full h-[40vh] min-h-[300px] flex-shrink-0">
                <QuickViewGallery
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

              {/* Content */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                  <QuickViewInfo
                    product={product}
                    isWishlisted={isWishlisted}
                    onWishlistToggle={handleWishlistToggle}
                    className="mb-6"
                  />

                  <QuickViewActions
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

                  <Link
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="text-[10px] underline hover:no-underline uppercase tracking-wider text-center block mt-6"
                  >
                    View Full Product Details
                  </Link>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
        />
      </>
    );
  }

  // Desktop view using Modal
  return (
    <>
      <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <ModalContent
          className="max-w-6xl w-full h-[85vh] min-h-[600px] p-0 gap-0 overflow-hidden"
          showCloseButton={true}
        >
          <VisuallyHidden>
            <ModalHeader>
              <ModalTitle>Product Quick View - {product.name}</ModalTitle>
              <ModalDescription>
                View product details for {product.name} and add to cart
              </ModalDescription>
            </ModalHeader>
          </VisuallyHidden>

          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Product Images */}
            <QuickViewImage
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

            {/* Product Details & Actions */}
            <div className="flex flex-col h-full min-h-0">
              <ModalBody className="p-6 lg:p-8">
                <QuickViewInfo
                  product={product}
                  isWishlisted={isWishlisted}
                  onWishlistToggle={handleWishlistToggle}
                  className="mb-6"
                />

                <QuickViewActions
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
              </ModalBody>

              <ModalFooter className="border-t p-4 lg:p-6">
                <Link
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="text-[10px] underline hover:no-underline uppercase tracking-wider text-center w-full"
                >
                  View Full Product Details
                </Link>
              </ModalFooter>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </>
  );
}