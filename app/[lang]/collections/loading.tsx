// Simple skeleton components inline

/**
 * Loading boundary for collections page
 * PERFORMANCE: Prevents 1.8s loading gap for navigation flows
 */
export default function CollectionsLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header Skeleton */}
      <section className="section-padding border-b border-subtle">
        <div className="strike-container text-center">
          <div className="h-12 w-64 bg-gray-200 animate-pulse rounded mx-auto mb-4" />
          <div className="h-6 w-96 bg-gray-200 animate-pulse rounded mx-auto" />
        </div>
      </section>

      {/* Collections Grid Skeleton */}
      <section className="section-padding">
        <div className="strike-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                {/* Collection Image Skeleton */}
                <div className="aspect-[4/3] bg-gray-200 animate-pulse rounded-lg" />
                
                {/* Collection Content Skeleton */}
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                </div>
                
                {/* CTA Button Skeleton */}
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections Carousel Skeleton */}
      <section className="section-padding bg-gray-50">
        <div className="strike-container">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}