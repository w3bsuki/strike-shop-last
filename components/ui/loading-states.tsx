import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
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
 */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="h-24 w-24 shrink-0" />
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
 */
export function CategoryCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
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
    <section className="relative h-[70vh] bg-gray-100">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
          <Skeleton className="h-12 w-40 mx-auto" />
        </div>
      </div>
    </section>
  );
}
