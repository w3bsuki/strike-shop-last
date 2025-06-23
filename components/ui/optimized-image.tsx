'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  aspectRatio?: string;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with progressive loading, lazy loading,
 * and performance optimizations for e-commerce
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  aspectRatio,
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  objectFit = 'cover',
  quality = 85,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // PERFORMANCE: Generate ultra-light optimized blur placeholder
  const defaultBlurDataURL = 
    blurDataURL || 
    `data:image/svg+xml;base64,${btoa(
      `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#gradient)" opacity="0.3"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e5e7eb"/>
            <stop offset="100%" style="stop-color:#d1d5db"/>
          </linearGradient>
        </defs>
      </svg>`
    )}`;

  // PERFORMANCE: Advanced Intersection Observer with smart preloading
  useEffect(() => {
    if (priority || isInView) return;

    // CRITICAL: Use passive observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Increased margin for better UX
        threshold: 0.1,
        // PERFORMANCE: Use passive event listeners
      }
    );

    const element = imgRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  const containerStyle = aspectRatio ? { aspectRatio } : {};

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      style={containerStyle}
    >
      {/* PERFORMANCE: Ultra-smooth loading skeleton with shimmer */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 skeleton-shimmer bg-gray-200" />
      )}
      
      {/* CRITICAL: Optimized image with perfect loading strategy */}
      {(isInView || priority) && !isError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300 ease-in-out',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down',
            // PERFORMANCE: GPU acceleration for smooth animations
            'transform-gpu will-change-[opacity]'
          )}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          quality={quality}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          style={{ width: '100%', height: '100%' }}
          // PERFORMANCE: Optimize image decoding
          decoding="async"
        />
      )}
      
      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded" />
            <p className="text-sm text-gray-500">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Product image component with optimized defaults for e-commerce
 */
export function ProductImage({
  src,
  alt,
  priority = false,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'aspectRatio'> & {
  width?: never;
  height?: never;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={500}
      aspectRatio="4/5"
      priority={priority}
      className={cn('rounded-lg', className)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
      quality={90}
      {...props}
    />
  );
}

/**
 * Hero image component with optimized defaults for large images
 */
export function HeroImage({
  src,
  alt,
  priority = true,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'aspectRatio'> & {
  width?: never;
  height?: never;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      aspectRatio="16/9"
      priority={priority}
      className={cn('w-full', className)}
      sizes="100vw"
      quality={95}
      objectFit="cover"
      {...props}
    />
  );
}