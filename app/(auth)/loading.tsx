/**
 * Loading boundary for auth routes (sign-in, sign-up, etc.)
 * PERFORMANCE: Smooth auth flow transitions
 */
export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mx-auto" />
        </div>

        {/* Form Container Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {/* Form Title Skeleton */}
          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mb-6" />

          {/* Form Fields Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Submit Button Skeleton */}
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded mt-6" />

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200 animate-pulse" />
            <div className="h-4 w-8 bg-gray-200 animate-pulse rounded mx-4" />
            <div className="flex-1 h-px bg-gray-200 animate-pulse" />
          </div>

          {/* Social Auth Buttons Skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-gray-200 animate-pulse rounded" />
            ))}
          </div>

          {/* Footer Links Skeleton */}
          <div className="text-center mt-6">
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}