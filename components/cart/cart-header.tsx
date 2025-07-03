'use client';

import { X, ShoppingBag } from 'lucide-react';

interface CartHeaderProps {
  totalItems: number;
  onClose: () => void;
}

export function CartHeader({ totalItems, onClose }: CartHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-subtle">
      <div className="flex items-center space-x-2">
        <ShoppingBag className="h-5 w-5" />
        <h2 className="text-lg font-bold uppercase tracking-wider">
          Cart ({totalItems})
        </h2>
      </div>
      <button 
        onClick={onClose} 
        aria-label="Close cart" 
        className="h-11 w-11 flex items-center justify-center -mr-3 touch-manipulation"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}