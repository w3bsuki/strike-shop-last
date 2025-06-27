'use client';

import dynamic from 'next/dynamic';

const CartSidebar = dynamic(
  () => import('@/components/cart-sidebar'),
  { 
    loading: () => (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white animate-pulse" />
      </div>
    )
  }
);

export default function CartModal() {
  // Cart sidebar handles its own closing logic
  // The CartSidebar component manages its own state and closing

  return <CartSidebar />;
}