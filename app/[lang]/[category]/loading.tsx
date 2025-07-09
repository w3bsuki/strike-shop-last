import { Skeleton } from '@/components/ui/skeleton';

// PERFORMANCE: Category-specific loading state with filter skeleton
export default function CategoryLoading() {
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

      <div className="section-padding">
        <div className="strike-container">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 mb-8">
            <Skeleton className="h-4 w-12 skeleton-shimmer" />
            <span>/</span>
            <Skeleton className="h-4 w-24 skeleton-shimmer" />
          </div>

          {/* Category Header */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4 skeleton-shimmer" />
            <Skeleton className="h-4 w-32 skeleton-shimmer" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="space-y-6">
                {/* Sort */}
                <div>
                  <Skeleton className="h-4 w-16 mb-3 skeleton-shimmer" />
                  <Skeleton className="h-10 w-full skeleton-shimmer" />
                </div>

                {/* Price Filter */}
                <div>
                  <Skeleton className="h-4 w-12 mb-3 skeleton-shimmer" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full skeleton-shimmer" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-12 skeleton-shimmer" />
                      <Skeleton className="h-4 w-12 skeleton-shimmer" />
                    </div>
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <Skeleton className="h-4 w-8 mb-3 skeleton-shimmer" />
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full skeleton-shimmer" />
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div>
                  <Skeleton className="h-4 w-12 mb-3 skeleton-shimmer" />
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 skeleton-shimmer" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-4 w-32 skeleton-shimmer" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[3/4] w-full skeleton-shimmer" />
                    <Skeleton className="h-4 w-full skeleton-shimmer" />
                    <Skeleton className="h-4 w-16 skeleton-shimmer" />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                  <Skeleton className="h-8 w-8 skeleton-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}