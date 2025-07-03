'use client';

import React from 'react';
import { Plus, Minus, Check, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickViewActionsProps {
  sizes: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  isAdded: boolean;
  isSoldOut?: boolean;
  onSizeGuideOpen?: () => void;
  className?: string;
}

export function QuickViewActions({
  sizes,
  selectedSize,
  onSizeSelect,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAdded,
  isSoldOut,
  onSizeGuideOpen,
  className,
}: QuickViewActionsProps) {
  const decreaseQuantity = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < 10) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Size Selection */}
      {!isSoldOut && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Select Size</label>
            {onSizeGuideOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSizeGuideOpen}
                className="text-xs"
              >
                <Ruler className="h-3 w-3 mr-1" />
                Size Guide
              </Button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Select size">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeSelect(size)}
                role="radio"
                aria-checked={selectedSize === size}
                aria-label={`Size ${size}`}
                disabled={isSoldOut}
                className={cn(
                  'min-h-touch px-4 text-sm font-medium border-2 rounded-md transition-all',
                  'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black',
                  selectedSize === size
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200',
                  isSoldOut && 'opacity-50 cursor-not-allowed'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {!isSoldOut && (
        <div>
          <label className="text-sm font-medium mb-3 block">Quantity</label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={increaseQuantity}
              disabled={quantity >= 10}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={onAddToCart}
        disabled={!selectedSize || isSoldOut || isAdded}
        className={cn(
          'w-full min-h-touch-lg text-base font-semibold transition-all',
          isAdded && 'bg-success hover:bg-success'
        )}
      >
        {isAdded ? (
          <span className="flex items-center justify-center">
            <Check className="h-5 w-5 mr-2" />
            Added to Cart!
          </span>
        ) : isSoldOut ? (
          'Sold Out'
        ) : !selectedSize ? (
          'Select a Size'
        ) : (
          'Add to Cart'
        )}
      </Button>
    </div>
  );
}