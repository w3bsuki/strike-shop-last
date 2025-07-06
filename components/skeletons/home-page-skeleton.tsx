export function HomePageSkeleton() {
  return (
    <div className="space-y-8 md:space-y-12 lg:space-y-16">
      {/* Category Grid Skeleton */}
      <section className="space-y-4 md:space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square animate-pulse bg-muted rounded-lg" />
              <div className="h-4 animate-pulse bg-muted rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* Product Section Skeleton */}
      <section className="space-y-4 md:space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] animate-pulse bg-muted rounded-lg" />
              <div className="space-y-1">
                <div className="h-4 animate-pulse bg-muted rounded w-3/4" />
                <div className="h-4 animate-pulse bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Section Skeleton */}
      <section className="space-y-4 md:space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}