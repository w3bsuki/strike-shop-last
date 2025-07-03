'use client';

import React from 'react';
import { Eye } from 'lucide-react';

interface QuickViewButtonProps {
  onClick: (e: React.MouseEvent) => void;
  productName: string;
  className?: string;
}

/**
 * QuickViewButton - Modern secondary action button with shadcn/ui patterns
 */
export const QuickViewButton = React.memo(({ onClick, productName, className = '' }: QuickViewButtonProps) => (
  <button
    className={`
      group/btn relative inline-flex h-11 w-11 items-center justify-center
bg-white/95 backdrop-blur-md
      border border-black/10 shadow-lg
      text-gray-700 hover:text-black
      hover:bg-white hover:border-black/20 hover:shadow-xl
      active:scale-95 active:shadow-md
      transition-all duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
      touch-manipulation
      ${className}
    `}
    onClick={onClick}
    type="button"
    aria-label={`Quick view ${productName}`}
  >
    <Eye 
      className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" 
      aria-hidden="true" 
      strokeWidth={1.5} 
    />
    
    {/* Tooltip */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
      Quick View
    </div>
  </button>
));

QuickViewButton.displayName = 'QuickViewButton';