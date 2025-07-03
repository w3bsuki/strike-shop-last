'use client';

import { useCart, useCartActions } from '@/lib/stores';
import { CartHeader } from '@/components/cart/cart-header';
import { CartItem } from '@/components/cart/cart-item';
import { CartEmpty } from '@/components/cart/cart-empty';
import { CartError } from '@/components/cart/cart-error';
import { CartItemSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorBoundary } from '@/components/error-boundary';
import { lazy, Suspense } from 'react';

// Lazy load the footer for better performance
const CartFooter = lazy(() => import('@/components/cart/cart-footer').then(module => ({ default: module.CartFooter })));

// Performance: CartSidebar optimized with component extraction and lazy loading
// Phase 2: Performance Critical - Reduced complexity and improved re-render performance
export default function CartSidebar() {
  const { items, isOpen, isLoading, error } = useCart();
  const { setCartOpen, updateItemQuantity, removeItem, getTotals, getItemCount } = useCartActions();

  if (!isOpen) return null;

  const closeCart = () => setCartOpen(false);
  const totals = getTotals();
  const totalItems = getItemCount();
  const hasItems = items.length > 0;

  return (
    <div className="fixed inset-0" style={{ zIndex: 'var(--z-modal)' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
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
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col">
        <CartHeader totalItems={totalItems} onClose={closeCart} />

        {/* Error Display */}
        {error && <CartError error={error} />}

        {/* Cart Content */}
        <ErrorBoundary
          fallback={() => (
            <div className="flex-1 flex items-center justify-center p-6">
              <CartError error="Something went wrong loading your cart" />
            </div>
          )}
        >
          <div className="flex-1 overflow-y-auto">
            {isLoading && !hasItems ? (
              <div className="p-6">
                {[1, 2, 3].map(i => (
                  <CartItemSkeleton key={i} />
                ))}
              </div>
            ) : !hasItems ? (
              <CartEmpty onCloseCart={closeCart} />
            ) : (
              <div className="p-6 space-y-6">
                {items.map((item) => (
                  <CartItem
                    key={`${item.lineItemId}-${item.size}`}
                    item={item}
                    isLoading={isLoading}
                    onUpdateQuantity={updateItemQuantity}
                    onRemoveItem={removeItem}
                    onCloseCart={closeCart}
                  />
                ))}
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* Lazy-loaded Footer */}
        {hasItems && (
          <Suspense fallback={<div className="h-32 border-t border-border bg-muted animate-pulse" />}>
            <CartFooter totals={totals} onCloseCart={closeCart} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
