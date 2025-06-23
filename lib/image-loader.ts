/**
 * Performance-optimized image loader utilities
 */

// Preload critical images for better performance
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch preload images
export const preloadImages = async (srcs: string[]): Promise<void> => {
  await Promise.all(srcs.map(preloadImage));
};

// Add link preload tags for critical images
export const addImagePreloadTags = (images: string[]) => {
  if (typeof window === 'undefined') return;
  
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Intersection Observer for lazy loading
export const createImageObserver = (
  onIntersect: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        onIntersect(entry);
      }
    });
  }, {
    rootMargin: '50px',
    ...options
  });
};

// Progressive image loading with blur placeholder
export const getProgressiveImageProps = (src: string, placeholder?: string) => {
  return {
    src,
    placeholder: placeholder || 'blur',
    blurDataURL: placeholder || generateBlurDataURL(),
    loading: 'lazy' as const,
  };
};

// Generate a simple blur data URL
const generateBlurDataURL = () => {
  // Simple gray blur placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMjAiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UwZTBlMCIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9zdmc+';
};