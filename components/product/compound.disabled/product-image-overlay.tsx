'use client';

import React from 'react';
import { QuickViewButton } from './quick-view-button';
import { useProductActions } from '../hooks/use-product-actions';
import type { SimpleProduct } from '../types';
import type { IntegratedProduct } from '@/types/integrated';

interface ProductImageOverlayProps {
  product: SimpleProduct;
  rawProduct: SimpleProduct | IntegratedProduct;
}

/**
 * ProductImageOverlay - Client Component for interactive overlay
 * PERFORMANCE: Only interactive parts are client-side
 */
export const ProductImageOverlay = React.memo(({ product, rawProduct }: ProductImageOverlayProps) => {
  const actions = useProductActions(product, rawProduct);
  
  return (
    <>
      {/* Overlay gradient on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      
      {/* Quick View Button - Bottom center on hover */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <QuickViewButton 
          onClick={actions.handleQuickView} 
          productName={product.name}
        />
      </div>
    </>
  );
});

ProductImageOverlay.displayName = 'ProductImageOverlay';