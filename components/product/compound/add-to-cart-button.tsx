'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface AddToCartButtonProps {
  onClick: (e: React.MouseEvent) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
  productName: string;
}

/**
 * AddToCartButton - Atomic component for add to cart action
 */
export const AddToCartButton = React.memo(({ 
  onClick, 
  isLoading, 
  disabled, 
  productName 
}: AddToCartButtonProps) => (
  <button
    className="min-h-space-11 min-w-space-11 flex items-center justify-center bg-strike-white text-strike-black border border-strike-black hover:bg-strike-black hover:text-strike-white transition-colors duration-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
    onClick={onClick}
    disabled={isLoading || disabled}
    type="button"
    aria-label={`Add ${productName} to cart`}
  >
    <ShoppingBag className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} aria-hidden="true" strokeWidth={1.5} />
  </button>
));

AddToCartButton.displayName = 'AddToCartButton';