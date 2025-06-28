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
    className="h-12 w-12 flex items-center justify-center bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors active:scale-95"
    onClick={onClick}
    type="button"
    aria-label={`Quick view ${productName}`}
  >
    <Eye className="h-5 w-5" aria-hidden="true" />
  </button>
));

QuickViewButton.displayName = 'QuickViewButton';