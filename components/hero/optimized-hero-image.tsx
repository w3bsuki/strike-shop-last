"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { heroOverlayClasses, type HeroOverlay } from "@/config/hero";

interface OptimizedHeroImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  overlay?: HeroOverlay;
  priority?: boolean;
  blurDataURL?: string;
}

const OptimizedHeroImage = React.forwardRef<HTMLDivElement, OptimizedHeroImageProps>(
  ({ className, src, alt, overlay = "gradient", priority = true, blurDataURL, children, ...props }, ref) => {
    // Generate srcSet for responsive images
    const generateSrcSet = () => {
      // Check if it's a local optimized image
      if (src.startsWith('/images/hero/') && src.includes('strike-ss25')) {
        return {
          src: '/images/hero/strike-ss25-hero.jpg',
          srcSet: `
            /images/hero/strike-ss25-hero-480w.webp 480w,
            /images/hero/strike-ss25-hero-768w.webp 768w,
            /images/hero/strike-ss25-hero-1280w.webp 1280w,
            /images/hero/strike-ss25-hero-1920w.webp 1920w
          `.trim(),
          blurDataURL: blurDataURL || 'data:image/webp;base64,UklGRpYAAABXRUJQVlA4IIoAAADQAwCdASoUAAsAPm0skkWkIqGYBABABsSxgFh2C1jbBVO6+A9PYAAA/vobXpT6gK1yOmyMB7w/dMU0WL9nzjFZKUKb/hW8B3UeJtjWDg/QhjAqvksfBN6ckcx/+adhyaiZAu2XRlfkbId/yT/6NSrU84HHTS69xIx9xmZWKyfVdAQ2zgT4/DbgAAA='
        };
      }
      
      return { src, srcSet: undefined, blurDataURL: undefined };
    };

    const { src: imageSrc, blurDataURL: placeholderDataURL } = generateSrcSet();

    return (
      <div 
        ref={ref} 
        className={cn(
          "relative w-full h-full overflow-hidden",
          // Enhanced containment for optimized hero
          "contain-layout contain-style contain-paint",
          className
        )} 
        style={{
          // Advanced layout stability
          contain: 'layout style size paint',
          isolation: 'isolate',
          willChange: 'auto',
          // Prevent mobile zoom effects
          WebkitOverflowScrolling: 'auto',
          overscrollBehavior: 'none'
        }}
        {...props}
      >
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            className="object-cover object-center"
            priority={priority}
            sizes="(max-width: 768px) 100vw, 100vw"
            quality={90}
            placeholder={placeholderDataURL ? "blur" : "empty"}
            {...(placeholderDataURL && { blurDataURL: placeholderDataURL })}
            {...(!priority && { loading: "lazy" })}
            {...(priority ? { fetchPriority: "high" } : { fetchPriority: "auto" })}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              // Prevent zoom effects during scroll
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              // Mobile-specific optimizations
              touchAction: 'pan-y',
              WebkitTransform: 'translateZ(0)'
            }}
          />
        </div>
        {overlay !== "none" && (
          <div
            className={cn(
              "absolute inset-0 z-10",
              heroOverlayClasses[overlay]
            )}
            aria-hidden="true"
            style={{
              contain: 'layout style',
              isolation: 'isolate'
            }}
          />
        )}
        <div className="relative z-20">
          {children}
        </div>
      </div>
    );
  }
);
OptimizedHeroImage.displayName = "OptimizedHeroImage";

export { OptimizedHeroImage };