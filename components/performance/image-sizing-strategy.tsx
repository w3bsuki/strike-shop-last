'use client';

import { useState, useEffect } from 'react';

interface ImageSizes {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

interface ResponsiveSizes {
  sizes: string;
  srcSet: string;
}

/**
 * Advanced image sizing strategy for optimal performance
 * Implements responsive image loading with proper srcset and sizes
 */

// Breakpoints aligned with Tailwind defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Common image sizes for e-commerce
const IMAGE_PRESETS = {
  thumbnail: {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
    wide: '25vw',
  },
  product: {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '400px',
    wide: '400px',
  },
  hero: {
    mobile: '100vw',
    tablet: '100vw',
    desktop: '100vw',
    wide: '1920px',
  },
  gallery: {
    mobile: '100vw',
    tablet: '100vw',
    desktop: '80vw',
    wide: '1200px',
  },
  card: {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
    wide: '400px',
  },
};

/**
 * Generate responsive sizes attribute for images
 */
export function generateSizes(preset: keyof typeof IMAGE_PRESETS | ImageSizes): string {
  const sizes = typeof preset === 'string' ? IMAGE_PRESETS[preset] : preset;
  
  return [
    `(max-width: ${BREAKPOINTS.sm}px) ${sizes.mobile}`,
    `(max-width: ${BREAKPOINTS.md}px) ${sizes.tablet}`,
    `(max-width: ${BREAKPOINTS.lg}px) ${sizes.desktop}`,
    sizes.wide,
  ].join(', ');
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536, 1920]
): string {
  // Handle different image sources
  if (src.includes('unsplash.com')) {
    return widths
      .map(w => `${src}?w=${w}&q=80&auto=format 1x, ${src}?w=${w * 2}&q=80&auto=format 2x`)
      .join(', ');
  }
  
  if (src.includes('sanity.io')) {
    return widths
      .map(w => `${src}?w=${w}&auto=format 1x, ${src}?w=${w * 2}&auto=format 2x`)
      .join(', ');
  }
  
  // For Next.js optimized images
  return widths.map(w => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75 ${w}w`).join(', ');
}

/**
 * Hook to determine optimal image loading strategy
 */
export function useImageLoadingStrategy() {
  const [strategy, setStrategy] = useState<'eager' | 'lazy' | 'auto'>('auto');
  const [connectionType, setConnectionType] = useState<string>('unknown');
  
  useEffect(() => {
    // Check connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown');
      
      // Adjust strategy based on connection
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        setStrategy('lazy');
      } else if (connection.effectiveType === '4g') {
        setStrategy('eager');
      } else {
        setStrategy('auto');
      }
      
      // Listen for connection changes
      const handleChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);
  
  return { strategy, connectionType };
}

/**
 * Calculate optimal image dimensions based on container
 */
export function useOptimalImageDimensions(aspectRatio: number = 1) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    if (!containerRef) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = width / aspectRatio;
        setDimensions({ width, height });
      }
    });
    
    observer.observe(containerRef);
    return () => observer.disconnect();
  }, [containerRef, aspectRatio]);
  
  return { dimensions, setContainerRef };
}

/**
 * Smart image component with adaptive loading
 */
interface SmartImageProps {
  src: string;
  alt: string;
  preset?: keyof typeof IMAGE_PRESETS;
  aspectRatio?: number;
  priority?: boolean;
  className?: string;
}

export function SmartImage({
  src,
  alt,
  preset = 'product',
  aspectRatio = 4/5,
  priority = false,
  className = '',
}: SmartImageProps) {
  const { strategy } = useImageLoadingStrategy();
  const { dimensions, setContainerRef } = useOptimalImageDimensions(aspectRatio);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const sizes = generateSizes(preset);
  const srcSet = generateSrcSet(src);
  const loading = priority ? 'eager' : strategy === 'eager' ? 'eager' : 'lazy';
  
  return (
    <div 
      ref={setContainerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        width={dimensions.width || undefined}
        height={dimensions.height || undefined}
      />
    </div>
  );
}

/**
 * Picture element for art direction
 */
interface ResponsivePictureProps {
  sources: {
    media: string;
    srcSet: string;
    type?: string;
  }[];
  fallbackSrc: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function ResponsivePicture({
  sources,
  fallbackSrc,
  alt,
  className = '',
  loading = 'lazy',
}: ResponsivePictureProps) {
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          media={source.media}
          srcSet={source.srcSet}
          type={source.type}
        />
      ))}
      <img
        src={fallbackSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        className="w-full h-full object-cover"
      />
    </picture>
  );
}

/**
 * Export utility functions for use in other components
 */
export const imageSizingUtils = {
  generateSizes,
  generateSrcSet,
  presets: IMAGE_PRESETS,
  breakpoints: BREAKPOINTS,
};