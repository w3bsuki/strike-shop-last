'use client';

import dynamic from 'next/dynamic';

// Lazy load the Quick View Dialog for better performance
const QuickViewDialog = dynamic(
  () => import('@/components/quick-view/quick-view-dialog').then(mod => ({ default: mod.QuickViewDialog })),
  {
    loading: () => null, // Dialog handles its own loading state
  }
);

/**
 * QuickViewModal Component
 * 
 * Wrapper component that lazy loads the Quick View Dialog.
 * This reduces the initial bundle size and improves performance.
 */
export function QuickViewModal() {
  return <QuickViewDialog />;
}
