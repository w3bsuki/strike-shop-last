'use client';

import React from 'react';
import { Eye } from 'lucide-react';

interface QuickViewButtonProps {
  onClick: (e: React.MouseEvent) => void;
  productName: string;
}

/**
 * QuickViewButton - Atomic component for quick view action
 */
export const QuickViewButton = React.memo(({ onClick, productName }: QuickViewButtonProps) => (
  <button
    className="hidden md:flex min-h-space-11 min-w-space-11 items-center justify-center bg-strike-white text-strike-black border border-strike-black hover:bg-strike-black hover:text-strike-white transition-colors duration-base active:scale-95 touch-manipulation"
    onClick={onClick}
    type="button"
    aria-label={`Quick view ${productName}`}
  >
    <Eye className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} />
  </button>
));

QuickViewButton.displayName = 'QuickViewButton';