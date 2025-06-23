import { Skeleton } from '@/components/ui/skeleton';

// PERFORMANCE: Product-specific loading state for optimal UX
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="strike-container">
          <div className="flex items-center justify-between h-14">
            <div className="lg:hidden">
              <Skeleton className="h-5 w-5 skeleton-shimmer" />
            </div>
            <div className="flex-1 flex justify-center lg:justify-start">
              <Skeleton className="h-6 w-20 skeleton-shimmer" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 skeleton-shimmer" />
              <Skeleton className="h-4 w-4 skeleton-shimmer" />
              <Skeleton className="h-4 w-4 skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="section-padding">
        <div className="strike-container">
          <div className="flex items-center space-x-2 mb-8">
            <Skeleton className="h-4 w-12 skeleton-shimmer" />
            <span>/</span>
            <Skeleton className="h-4 w-16 skeleton-shimmer" />
            <span>/</span>
            <Skeleton className="h-4 w-24 skeleton-shimmer" />
          </div>

          {/* Product Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <Skeleton className="aspect-[3/4] w-full skeleton-shimmer" />
              
              {/* Thumbnail Images */}
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full skeleton-shimmer" />
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Product Title */}
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 skeleton-shimmer" />
                <Skeleton className="h-6 w-1/4 skeleton-shimmer" />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 skeleton-shimmer" />
                <Skeleton className="h-4 w-24 skeleton-shimmer" />
              </div>

              {/* Size Selection */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-16 skeleton-shimmer" />
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full skeleton-shimmer" />
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-16 skeleton-shimmer" />
                <div className="flex space-x-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 skeleton-shimmer" />
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <Skeleton className="h-12 w-full skeleton-shimmer" />

              {/* Product Details */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-24 skeleton-shimmer" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                </div>
              </div>

              {/* Care Instructions */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-32 skeleton-shimmer" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-5/6 skeleton-shimmer" />
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-16">
            <Skeleton className="h-6 w-40 mb-8 skeleton-shimmer" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-full skeleton-shimmer" />
                  <Skeleton className="h-4 w-16 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}