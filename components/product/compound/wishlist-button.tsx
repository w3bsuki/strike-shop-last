'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isWishlisted: boolean;
  productName: string;
}

/**
 * WishlistButton - Atomic component for wishlist toggle action
 */
export const WishlistButton = React.memo(({ onClick, isWishlisted, productName }: WishlistButtonProps) => (
  <button
    className={`absolute top-space-3 right-space-3 min-h-space-10 min-w-space-10 flex items-center justify-center bg-strike-white/90 backdrop-blur-sm border border-strike-gray-200 hover:border-strike-black transition-all duration-base z-30 touch-manipulation ${
      isWishlisted ? 'text-strike-black' : 'text-strike-gray-600 hover:text-strike-black'
    }`}
    onClick={onClick}
    type="button"
    aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist ${productName}`}
    aria-pressed={isWishlisted}
  >
    <Heart
      className={`h-5 w-5 transition-colors ${
        isWishlisted ? 'fill-strike-black text-strike-black' : ''
      }`}
      aria-hidden="true"
      strokeWidth={1.5}
    />
  </button>
));

WishlistButton.displayName = 'WishlistButton';