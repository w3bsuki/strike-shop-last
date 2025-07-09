'use client';

import { useEffect } from 'react';
import { useCartActions } from '@/lib/stores';

export function CartInitializer() {
  const { initializeCart } = useCartActions();
  
  useEffect(() => {
    // Initialize cart on mount - only in browser
    if (typeof window !== 'undefined') {
      initializeCart();
    }
  }, [initializeCart]);
  
  return null;
}