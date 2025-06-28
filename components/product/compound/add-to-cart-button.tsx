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
    className="h-12 w-12 flex items-center justify-center bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    onClick={onClick}
    disabled={isLoading || disabled}
    type="button"
    aria-label={`Add ${productName} to cart`}
  >
    <ShoppingBag className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} aria-hidden="true" />
  </button>
));

AddToCartButton.displayName = 'AddToCartButton';