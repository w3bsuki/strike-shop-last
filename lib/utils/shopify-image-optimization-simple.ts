/**
 * Simplified Shopify CDN Image Optimization
 * Best practices without overengineering
 */

/**
 * Optimize Shopify CDN image URL - SIMPLE & EFFECTIVE
 * Reduces image size by 30-60% with WebP + quality optimization
 */
export function optimizeShopifyImage(
  url: string,
  width?: number,
  quality: number = 85
): string {
  if (!url || !url.includes('cdn.shopify.com')) {
    return url;
  }

  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  params.set('quality', quality.toString());
  params.set('format', 'webp');
  
  return `${url}?${params.toString()}`;
}

/**
 * Get optimized image props for Next.js Image component
 * Covers 90% of use cases with minimal complexity
 */
export function getOptimizedImageProps(
  url: string,
  context: 'thumbnail' | 'card' | 'detail' = 'card'
) {
  const configs = {
    thumbnail: { width: 80, quality: 80, sizes: '80px' },
    card: { width: 400, quality: 85, sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 400px' },
    detail: { width: 800, quality: 95, sizes: '(max-width: 768px) 100vw, 800px' },
  };

  const config = configs[context];
  const optimizedUrl = optimizeShopifyImage(url, config.width, config.quality);

  return {
    src: optimizedUrl,
    sizes: config.sizes,
    quality: config.quality,
  };
}