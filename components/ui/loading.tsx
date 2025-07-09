import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Unified Loading Components for Strike Shop
 * Consistent loading states across the application
 */

// Base skeleton component
export function Skeleton({ 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}

// Spinning loader with optional text
export function Spinner({ 
  size = 'default',
  className,
  text
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  text?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Full page loading state
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" text={text} />
    </div>
  );
}

// Product card skeleton - matches ProductCard exactly
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-0', className)}>
      {/* Image with exact aspect ratio */}
      <div className="relative bg-muted aspect-[3/4] overflow-hidden">
        <Skeleton className="absolute inset-0" />
        {/* Wishlist button position */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
        </div>
      </div>
      {/* Content with exact min-height */}
      <div className="space-y-2 p-3 min-h-[4.5rem]">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Product showcase skeleton - for homepage sections
export function ProductShowcaseSkeleton({ 
  title = true,
  count = 4 
}: { 
  title?: boolean;
  count?: number;
}) {
  return (
    <div className="w-full">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>

      {/* Mobile horizontal scroll */}
      <div className="md:hidden overflow-hidden">
        <div className="flex gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[calc(50%-8px)]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hero carousel skeleton
export function HeroCarouselSkeleton() {
  return (
    <div className="relative w-full bg-white overflow-hidden flex flex-col">
      <div className="relative w-full h-[70vh] md:h-[75vh] lg:h-[80vh] bg-gray-100 animate-pulse flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4 px-4">
            <Skeleton className="h-4 bg-gray-200 w-24 mx-auto" />
            <Skeleton className="h-12 bg-gray-200" />
            <Skeleton className="h-8 bg-gray-200 w-3/4 mx-auto" />
            <Skeleton className="h-12 bg-gray-200 w-48 mx-auto mt-8" />
          </div>
        </div>
      </div>
      <div className="h-20 bg-gray-100 border-t border-gray-200 animate-pulse" />
    </div>
  );
}

// Cart item skeleton
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <div className="shrink-0 relative bg-muted w-24 aspect-[3/4]">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

// Mini cart skeleton
export function MiniCartSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <CartItemSkeleton key={i} />
        ))}
      </div>
      <div className="border-t p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between font-semibold">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

// Product details skeleton
export function ProductDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image gallery */}
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded" />
          ))}
        </div>
      </div>

      {/* Product info */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/4" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-16" />
            ))}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Collection page skeleton
export function CollectionPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Filters bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Search results skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <Skeleton className="w-20 h-20 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Account page skeleton
export function AccountPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* User info */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full mt-6" />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-0 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Export all components for easy access
export const Loading = {
  Skeleton,
  Spinner,
  Page: PageLoader,
  ProductCard: ProductCardSkeleton,
  ProductShowcase: ProductShowcaseSkeleton,
  HeroCarousel: HeroCarouselSkeleton,
  CartItem: CartItemSkeleton,
  MiniCart: MiniCartSkeleton,
  ProductDetails: ProductDetailsSkeleton,
  Collection: CollectionPageSkeleton,
  SearchResults: SearchResultsSkeleton,
  Account: AccountPageSkeleton,
  Form: FormSkeleton,
  Table: TableSkeleton,
};

export default Loading;