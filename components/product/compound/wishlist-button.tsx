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
export const WishlistButton = React.memo(({ onClick, isWishlisted }: WishlistButtonProps) => (
  <button
    className={`absolute top-3 right-3 h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-all z-30 ${
      isWishlisted ? 'text-red-500' : 'text-gray-700 hover:text-black'
    }`}
    onClick={onClick}
    type="button"
    aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist`}
    aria-pressed={isWishlisted}
  >
    <Heart
      className={`h-5 w-5 transition-colors ${
        isWishlisted ? 'fill-red-500 text-red-500' : ''
      }`}
      aria-hidden="true"
    />
  </button>
));

WishlistButton.displayName = 'WishlistButton';