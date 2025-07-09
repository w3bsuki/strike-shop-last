/**
 * Loading boundary for account routes
 * PERFORMANCE: Prevents auth check loading gaps
 */
export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-gray-200 animate-pulse bg-gray-50" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Account Dashboard Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation Skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-gray-200 animate-pulse rounded" />
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card Skeleton */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                    <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Order History Skeleton */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded border">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 animate-pulse rounded" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                        <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}