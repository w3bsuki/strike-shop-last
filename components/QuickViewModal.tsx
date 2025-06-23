'use client';

import { useQuickView } from '@/contexts/QuickViewContext';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// BUNDLE OPTIMIZATION: Lazy load QuickView to reduce initial bundle
const ProductQuickView = dynamic(
  () => import('@/components/product/quick-view/index').then(mod => ({ default: mod.ProductQuickView })),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
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
    ssr: false,
  }
);

/**
 * OPTIMIZED: Global QuickViewModal Component
 * 
 * Provides seamless product quick view experience with:
 * - Dynamic loading for performance (reduces initial bundle)
 * - Smooth loading states
 * - Perfect mobile responsiveness
 * - Accessibility compliance
 */
export function QuickViewModal() {
  const { isOpen, currentProduct, closeQuickView } = useQuickView();

  // Only render when needed for optimal performance
  if (!isOpen || !currentProduct) return null;

  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <ProductQuickView
        product={currentProduct}
        isOpen={isOpen}
        onClose={closeQuickView}
      />
    </Suspense>
  );
}
