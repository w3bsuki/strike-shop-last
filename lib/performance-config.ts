/**
 * Performance configuration for Strike Shop
 * Centralizes all performance-related settings
 */

export const performanceConfig = {
  // Caching durations (in milliseconds)
  cache: {
    api: 5 * 60 * 1000, // 5 minutes
    images: 24 * 60 * 60 * 1000, // 24 hours
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Image optimization settings
  images: {
    quality: 85,
    formats: ['webp', 'avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Lazy loading thresholds
  lazyLoad: {
    rootMargin: '50px',
    threshold: 0.01,
  },

  // Request batching
  batching: {
    maxBatchSize: 10,
    batchDelay: 50, // milliseconds
  },

  // Performance thresholds
  thresholds: {
    renderTime: 50, // milliseconds
    apiTimeout: 5000, // milliseconds
    imageLoadTimeout: 10000, // milliseconds
  },

  // Prefetch settings
  prefetch: {
    enabled: true,
    maxPrefetchItems: 5,
    prefetchDelay: 100, // milliseconds
  },

  // Web Vitals targets
  webVitals: {
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100, // First Input Delay (ms)
    CLS: 0.1, // Cumulative Layout Shift
    FCP: 1800, // First Contentful Paint (ms)
    TTFB: 800, // Time to First Byte (ms)
  },
};

// Helper to check if a metric meets performance target
export const meetsTarget = (metric: string, value: number): boolean => {
  const target = performanceConfig.webVitals[metric as keyof typeof performanceConfig.webVitals];
  return target ? value <= target : true;
};

// Get cache duration for a specific type
export const getCacheDuration = (type: keyof typeof performanceConfig.cache): number => {
  return performanceConfig.cache[type] || performanceConfig.cache.api;
};