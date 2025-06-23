'use client';

import React from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductActionsProps {
  sizes: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  isAdded: boolean;
  isSoldOut?: boolean;
  onSizeGuideOpen: () => void;
}

export function ProductActions({
  sizes,
  selectedSize,
  onSizeSelect,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAdded,
  isSoldOut = false,
  onSizeGuideOpen,
}: ProductActionsProps) {
  const incrementQuantity = () => {
    onQuantityChange(Math.min(quantity + 1, 10));
  };

  const decrementQuantity = () => {
    onQuantityChange(Math.max(quantity - 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* Size Selector */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider">SIZE</h3>
          <button
            onClick={onSizeGuideOpen}
            className="text-[10px] underline hover:no-underline text-[var(--subtle-text-color)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            SIZE GUIDE
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select size">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onSizeSelect(size)}
              disabled={isSoldOut}
              role="radio"
              aria-checked={selectedSize === size}
              aria-label={`Size ${size}`}
              className={`py-3 text-xs font-bold uppercase tracking-wider transition-all border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] touch-manipulation ${
                selectedSize === size
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selector */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3">
          QUANTITY
        </h3>
        <div className="flex items-center space-x-4" role="group" aria-label="Quantity selector">
          <button
            onClick={decrementQuantity}
            disabled={isSoldOut || quantity <= 1}
            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[44px] min-h-[44px]"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-sm font-bold w-8 text-center" aria-label={`Quantity: ${quantity}`} aria-live="polite">{quantity}</span>
          <button
            onClick={incrementQuantity}
            disabled={isSoldOut || quantity >= 10}
            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[44px] min-h-[44px]"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={onAddToCart}
        disabled={!selectedSize || isSoldOut || isAdded}
        className="w-full py-6 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
      >
        {isAdded ? (
          <span className="flex items-center justify-center">
            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
            ADDED TO CART
          </span>
        ) : isSoldOut ? (
          'SOLD OUT'
        ) : !selectedSize ? (
          'SELECT SIZE'
        ) : (
          'ADD TO CART'
        )}
      </Button>

      {/* Info Text */}
      {!isSoldOut && !selectedSize && (
        <p className="text-[10px] text-center text-[var(--subtle-text-color)]" role="alert" aria-live="polite">
          Please select a size
        </p>
      )}
    </div>
  );
}
