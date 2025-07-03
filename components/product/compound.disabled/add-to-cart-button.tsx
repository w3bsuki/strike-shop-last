'use client';

import React from 'react';
import { ShoppingBag, Plus } from 'lucide-react';

interface AddToCartButtonProps {
  onClick: (e: React.MouseEvent) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
  productName: string;
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * AddToCartButton - Modern primary action button with multiple variants
 */
export const AddToCartButton = React.memo(({ 
  onClick, 
  isLoading, 
  disabled, 
  productName,
  variant = 'icon',
  className = ''
}: AddToCartButtonProps) => {
  const isIconVariant = variant === 'icon';
  
  return (
    <button
      className={`
        group/btn relative inline-flex items-center justify-center
        font-medium text-sm
        ${isIconVariant 
          ? 'h-11 w-11' 
          : 'h-11 w-full px-4'
        }
        bg-black text-white
        hover:bg-gray-800 hover:shadow-lg
        active:scale-[0.98] active:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:active:scale-100
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
        touch-manipulation
        ${className}
      `}
      onClick={onClick}
      disabled={isLoading || disabled}
      type="button"
      aria-label={`Add ${productName} to cart`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          {!isIconVariant && <span className="ml-2">Adding...</span>}
        </>
      ) : (
        <>
          {isIconVariant ? (
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" strokeWidth={2} />
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              <span className="ml-2">Add to Cart</span>
            </>
          )}
        </>
      )}
      
      {/* Tooltip for icon variant */}
      {isIconVariant && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          Add to Cart
        </div>
      )}
    </button>
  );
});

AddToCartButton.displayName = 'AddToCartButton';