import { ProductPageSkeleton } from '@/components/ui/loading-skeleton';

// PERFORMANCE: Standardized product loading state for optimal UX
// Phase 1: Standardized Loading States - Using centralized skeleton system
export default function ProductLoading() {
  return <ProductPageSkeleton />;
}