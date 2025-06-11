import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="strike-container">
          <div className="flex items-center justify-between h-14">
            <div className="lg:hidden">
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="flex-1 flex justify-center lg:justify-start">
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="section-padding">
        <div className="strike-container">
          {/* Hero Section */}
          <div className="mb-8">
            <Skeleton className="h-[60vh] w-full rounded-none mb-4" />
          </div>

          {/* Section Title */}
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-4" />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Additional Content Sections */}
          <div className="mt-12 space-y-8">
            <div>
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-muted mt-16 py-12">
        <div className="strike-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-3 w-16" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
