'use client';

import { useEffect } from 'react';
import { useCartActions } from '@/lib/stores';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { initializeCart } = useCartActions();

  useEffect(() => {
    // Initialize cart on mount
    initializeCart().catch(console.error);
  }, [initializeCart]);

  return <>{children}</>;
}