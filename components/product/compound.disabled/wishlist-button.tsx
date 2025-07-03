'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isWishlisted: boolean;
  productName: string;
  className?: string;
}

/**
 * WishlistButton - Modern tertiary action button for wishlist toggle
 */
export const WishlistButton = React.memo(({ onClick, isWishlisted, productName, className = '' }: WishlistButtonProps) => (
  <button
    className={`
      group/btn absolute top-3 right-3 z-30
      inline-flex h-11 w-11 items-center justify-center
bg-background/95 backdrop-blur-md
      border border-border shadow-lg
      hover:bg-background hover:border-primary/20 hover:shadow-xl
      active:scale-95 active:shadow-md
      transition-all duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
      touch-manipulation
      ${isWishlisted 
        ? 'text-destructive border-destructive/20 hover:border-destructive/30' 
        : 'text-muted-foreground hover:text-destructive'
      }
      ${className}
    `}
    onClick={onClick}
    type="button"
    aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist ${productName}`}
    aria-pressed={isWishlisted}
  >
    <Heart
      className={`h-4 w-4 transition-all duration-200 group-hover/btn:scale-110 ${
        isWishlisted 
          ? 'fill-red-500 text-red-500' 
          : 'fill-transparent group-hover/btn:fill-red-100'
      }`}
      aria-hidden="true"
      strokeWidth={1.5}
    />
    
    {/* Tooltip */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
      {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </div>
  </button>
));

WishlistButton.displayName = 'WishlistButton';