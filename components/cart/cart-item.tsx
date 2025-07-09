'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { memo } from 'react';

interface CartItemProps {
  item: {
    id: string;
    lineItemId: string;
    name: string;
    slug: string;
    size: string;
    sku?: string;
    quantity: number;
    image: string | null;
    pricing: {
      displayTotalPrice: string;
    };
  };
  isLoading: boolean;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemoveItem: (id: string) => Promise<void>;
  onCloseCart: () => void;
}

export const CartItem = memo(function CartItem({
  item,
  isLoading,
  onUpdateQuantity,
  onRemoveItem,
  onCloseCart
}: CartItemProps) {
  const handleUpdateQuantity = async (newQuantity: number) => {
    try {
      // Haptic feedback for mobile
      if (navigator.vibrate) navigator.vibrate(30);
      await onUpdateQuantity(item.id, newQuantity);
    } catch (_error) {
      // Error handled by cart store
    }
  };

  const handleRemoveItem = async () => {
    try {
      // Haptic feedback for mobile
      if (navigator.vibrate) navigator.vibrate([50, 25, 50]);
      await onRemoveItem(item.id);
    } catch (_error) {
      // Error handled by cart store
    }
  };

  return (
    <div className="flex space-x-4">
      <div className="relative w-20 h-24 bg-muted flex-shrink-0">
        <Image
          src={item.image || '/placeholder.svg'}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${item.slug}`}
          onClick={onCloseCart}
          className="block hover:text-[var(--subtle-text-color)]"
        >
          <h3 className="text-sm font-medium mb-1 line-clamp-2">
            {item.name}
          </h3>
        </Link>
        <p className="text-xs text-[var(--subtle-text-color)] mb-2">
          Size: {item.size}
        </p>
        {item.sku && (
          <p className="text-xs text-[var(--subtle-text-color)] font-mono mb-2">
            {item.sku}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={isLoading}
              className="h-11 w-11 flex items-center justify-center border border-border hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium w-8 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={isLoading}
              className="h-11 w-11 flex items-center justify-center border border-border hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleRemoveItem}
            disabled={isLoading}
            className="h-11 w-11 flex items-center justify-center text-[var(--subtle-text-color)] hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold">
            {item.pricing.displayTotalPrice}
          </span>
        </div>
      </div>
    </div>
  );
});