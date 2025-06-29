'use client';

import { useCartStore } from '@/lib/cart-store';
import { createProductId, createQuantity } from '@/types/branded';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CartSidebar() {
  const {
    items,
    isOpen,
    isLoading,
    error,
    closeCart,
    updateQuantity,
    removeItem,
    getTotalItems,
    getTotalPrice,
    clearError,
  } = useCartStore();

  if (!isOpen) return null;

  const handleUpdateQuantity = async (
    id: string,
    size: string,
    quantity: number
  ) => {
    try {
      // Haptic feedback for mobile
      if (navigator.vibrate) navigator.vibrate(30);
      await updateQuantity(createProductId(id), size, createQuantity(quantity));
    } catch (_error) {
      // Error handled by cart store
    }
  };

  const handleRemoveItem = async (id: string, size: string) => {
    try {
      // Haptic feedback for mobile
      if (navigator.vibrate) navigator.vibrate([50, 25, 50]);
      await removeItem(createProductId(id), size);
    } catch (_error) {
      // Error handled by cart store
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0" style={{ zIndex: 'var(--z-modal)' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            closeCart();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close cart"
      />

      {/* Cart Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">
              Cart ({getTotalItems()})
            </h2>
          </div>
          <button onClick={closeCart} aria-label="Close cart" className="h-11 w-11 flex items-center justify-center -mr-3 touch-manipulation">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-700 touch-manipulation"
                aria-label="Clear error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold mb-2">Your cart is empty</h3>
              <p className="text-sm text-[var(--subtle-text-color)] mb-6">
                Add some items to get started
              </p>
              <Button onClick={closeCart} className="button-primary">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.lineItemId}-${item.size}`}
                  className="flex space-x-4"
                >
                  <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0">
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
                      onClick={closeCart}
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
                          onClick={() =>
                            handleUpdateQuantity(
                              item.id,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          disabled={isLoading}
                          className="h-11 w-11 flex items-center justify-center border border-subtle hover:border-black disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.id,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          disabled={isLoading}
                          className="h-11 w-11 flex items-center justify-center border border-subtle hover:border-black disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.size)}
                        disabled={isLoading}
                        className="h-11 w-11 flex items-center justify-center text-[var(--subtle-text-color)] hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold">
                        {item.pricing.displayUnitSalePrice ||
                          item.pricing.displayUnitPrice}
                      </span>
                      {item.pricing.displayUnitSalePrice && (
                        <span className="text-xs text-[var(--subtle-text-color)] line-through">
                          {item.pricing.displayUnitPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-subtle p-6 space-y-4">
            {/* Shipping Notice */}
            {subtotal < 100 && (
              <div className="text-xs text-[var(--subtle-text-color)] text-center p-2 bg-gray-50">
                Add {formatPrice(100 - subtotal)} more for free shipping
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-subtle pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/checkout" onClick={closeCart}>
                <Button className="button-primary w-full !py-3">
                  Checkout
                </Button>
              </Link>
              <Button
                onClick={closeCart}
                className="button-secondary w-full !py-2"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
