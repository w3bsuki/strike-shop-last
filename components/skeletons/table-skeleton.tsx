import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-32 mb-4 sm:mb-0" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {/* Table Header */}
        <div className="border-b bg-muted p-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
