import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

/**
 * BUNDLE OPTIMIZATION: Utility functions for optimizing component imports
 * These helpers make it easy to implement lazy loading across the application
 */

interface DynamicImportOptions {
  loading?: () => ReactNode;
  ssr?: boolean;
  suspense?: boolean;
}

/**
 * Create a lazily loaded component with consistent loading states
 */
export function lazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: DynamicImportOptions = {}
) {
  const defaultOptions: DynamicImportOptions = {
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded h-32 w-full" />
    ),
    ssr: true,
    ...options,
  };

  return dynamic(importFn as any, defaultOptions);
}

/**
 * Create a lazily loaded component for client-only features
 */
export function clientOnlyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: DynamicImportOptions = {}
) {
  return lazyComponent(importFn, {
    ...options,
    ssr: false,
  });
}

/**
 * Preload a dynamic component (useful for predictive loading)
 */
export function preloadComponent(
  importFn: () => Promise<any>
): Promise<any> {
  return importFn();
}

/**
 * Common loading skeletons for consistent UX
 */
export const LoadingSkeletons = {
  card: () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  ),
  
  form: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-900 rounded"></div>
    </div>
  ),
  
  chart: () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-100 rounded"></div>
    </div>
  ),
  
  table: () => (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-2"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded mb-1"></div>
      ))}
    </div>
  ),
  
  gallery: () => (
    <div className="animate-pulse">
      <div className="aspect-square bg-gray-200 rounded mb-4"></div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Performance hints for development
 */
export const performanceHints = {
  checkBundleSize: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`
        🚀 Bundle Optimization Tips:
        
        1. Run 'ANALYZE=true npm run build' to analyze bundle
        2. Use dynamic imports for heavy components
        3. Lazy load below-fold content with ViewportLoader
        4. Check Chrome DevTools Coverage tab for unused code
        5. Target: <300KB initial bundle
      `);
    }
  },
};

/**
 * List of components that should always be dynamically imported
 */
export const HEAVY_COMPONENTS = [
  'Sanity Studio',
  'Recharts',
  'Stripe Elements',
  'Rich Text Editors',
  'PDF Viewers',
  'Video Players',
  'Image Galleries',
  'Data Tables',
  'Complex Forms',
  'Analytics Scripts',
] as const;

/**
 * Helper to check if a component should be lazy loaded
 */
export function shouldLazyLoad(componentName: string): boolean {
  const patterns = [
    /modal/i,
    /dialog/i,
    /drawer/i,
    /carousel/i,
    /gallery/i,
    /chart/i,
    /editor/i,
    /admin/i,
    /dashboard/i,
  ];
  
  return patterns.some(pattern => pattern.test(componentName));
}