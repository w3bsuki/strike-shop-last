import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Product Card Skeleton
 * 
 * Loading skeleton that matches the exact dimensions of ProductCard
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-0', className)}>
      {/* Image skeleton with exact aspect ratio */}
      <div className="relative bg-gray-100 aspect-[3/4]">
        <Skeleton className="absolute inset-0" />
      </div>
      {/* Content skeleton with exact min-height */}
      <div className="space-y-2 p-3 min-h-[4.5rem]">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Product Grid Skeleton
 */
export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Product Details Skeleton
 */
export function ProductDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image Gallery */}
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-20" />
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Item Skeleton
 * 
 * Loading skeleton for cart items with proper aspect ratio
 */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      {/* Cart item image with 3/4 aspect ratio */}
      <div className="shrink-0 relative bg-gray-100 w-24 aspect-[3/4]">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * Category Card Skeleton
 * 
 * Loading skeleton for category cards
 */
export function CategoryCardSkeleton() {
  return (
    <div className="space-y-0">
      {/* Category image skeleton with 4/5 aspect ratio */}
      <div className="relative bg-gray-100 aspect-[4/5]">
        <Skeleton className="absolute inset-0" />
      </div>
    </div>
  );
}

/**
 * Order Item Skeleton
 */
export function OrderItemSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-16 w-16" />
        <Skeleton className="h-16 w-16" />
      </div>
    </div>
  );
}

/**
 * Text Skeleton with multiple lines
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Button Skeleton
 */
export function ButtonSkeleton({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'small' | 'large';
}) {
  const sizes = {
    small: 'h-8 w-20',
    default: 'h-10 w-32',
    large: 'h-12 w-full',
  };

  return <Skeleton className={cn(sizes[variant], className)} />;
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Form Field Skeleton
 */
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Checkout Form Skeleton
 */
export function CheckoutFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>

      <ButtonSkeleton variant="large" />
    </div>
  );
}

/**
 * Product Scroll Section Skeleton
 * Perfect for homepage product sections
 */
export function ProductScrollSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="section-padding">
      <div className="strike-container">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex overflow-x-auto gap-3 md:gap-4 pb-1">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[240px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Category Scroll Skeleton - Optimized for horizontal mobile layout
 */
export function CategoryScrollSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="section-padding">
      <div className="strike-container">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
        
        {/* Desktop Grid Skeleton */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/5] w-full" />
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll Skeleton */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40">
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero Banner Skeleton
 */
export function HeroBannerSkeleton() {
  return (
    <>
      {/* Desktop hero skeleton */}
      <section className="hidden md:block relative bg-gray-100" style={{ aspectRatio: '16/9' }}>
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
            <Skeleton className="h-12 w-40 mx-auto" />
          </div>
        </div>
      </section>
      {/* Mobile hero skeleton */}
      <section className="md:hidden relative bg-gray-100" style={{ aspectRatio: '4/5' }}>
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-5 w-64 mx-auto" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </div>
      </section>
    </>
  );
}
