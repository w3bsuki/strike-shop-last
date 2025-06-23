import { Skeleton } from '@/components/ui/skeleton';

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[85vh] min-h-[600px] p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Image Gallery Skeleton */}
          <div className="bg-gray-100 p-4">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="flex gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded" />
              ))}
            </div>
          </div>

          {/* Product Details Skeleton */}
          <div className="p-6 lg:p-8 space-y-6">
            {/* Product Title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Price */}
            <Skeleton className="h-10 w-40" />

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-12 h-12 rounded" />
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>

            {/* Footer Link */}
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
