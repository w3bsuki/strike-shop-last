'use client';

import { useQuickView } from '@/contexts/QuickViewContext';
import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { ShopifyService } from '@/lib/shopify/services';
import type { IntegratedProduct } from '@/types/integrated';

// BUNDLE OPTIMIZATION: Lazy load QuickView to reduce initial bundle
// Using the new modular QuickView implementation
const QuickViewModalModular = dynamic(
  () => import('@/components/quick-view/quick-view-modal-modular').then(mod => ({ default: mod.QuickViewModalModular })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 animate-pulse">
          <div className="flex space-x-6">
            <div className="w-1/2">
              <div className="bg-gray-200 aspect-square rounded"></div>
            </div>
            <div className="w-1/2 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    
  }
);

/**
 * OPTIMIZED: Global QuickViewModal Component
 * 
 * Provides seamless product quick view experience with:
 * - Modular, reusable modal components
 * - Dynamic loading for performance (reduces initial bundle)
 * - Smooth loading states
 * - Perfect mobile responsiveness
 * - Accessibility compliance
 */
export function QuickViewModal() {
  const { isOpen, productId, closeQuickView } = useQuickView();
  const [currentProduct, setCurrentProduct] = useState<IntegratedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      // Since getProductById doesn't exist, we'll use getProducts and filter
      ShopifyService.getProducts(50)
        .then(products => {
          const product = products.find(p => p.id === productId);
          if (product) {
            // Transform to format expected by QuickViewModalModular
            const transformedProduct = {
              id: product.id,
              name: product.content.name,
              price: product.pricing.displayPrice,
              originalPrice: product.pricing.displaySalePrice,
              discount: product.badges.isSale && product.pricing.discount 
                ? `-${product.pricing.discount.percentage}%` 
                : undefined,
              image: product.content.images[0]?.url || '/placeholder.svg',
              images: product.content.images.map((img: any) => typeof img === 'string' ? img : img.url),
              isNew: product.badges.isNew,
              soldOut: product.badges.isSoldOut,
              slug: product.slug,
              description: product.content.description,
              sizes: product.commerce.variants.map((v: any) => {
                // Extract size from variant title
                const sizeMatch = v.title.match(/Size: ([\w\s]+)/i) || v.title.match(/([XS|S|M|L|XL|XXL]+)/i);
                return sizeMatch ? sizeMatch[1] : v.title;
              }),
              variants: product.commerce.variants.map((v: any) => ({
                id: v.id,
                title: v.title,
                sku: v.sku,
                prices: v.pricing ? [{ amount: v.pricing.price }] : []
              }))
            };
            setCurrentProduct(transformedProduct);
          }
        })
        .catch((error: any) => {
          console.error('Failed to fetch product for quick view:', error);
          setCurrentProduct(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setCurrentProduct(null);
    }
  }, [isOpen, productId]);

  // Only render when needed for optimal performance
  if (!isOpen) return null;

  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      {isLoading ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : currentProduct ? (
        <QuickViewModalModular
          product={currentProduct}
          isOpen={isOpen}
          onClose={closeQuickView}
        />
      ) : null}
    </Suspense>
  );
}
