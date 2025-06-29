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
      <div ref={ref} className={cn("absolute inset-0", className)} {...props}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          sizes="100vw"
          quality={90}
          placeholder={placeholderDataURL ? "blur" : "empty"}
          {...(placeholderDataURL && { blurDataURL: placeholderDataURL })}
          {...(!priority && { loading: "lazy" })}
          {...(priority ? { fetchPriority: "high" } : { fetchPriority: "auto" })}
        />
        {overlay !== "none" && (
          <div
            className={cn(
              "absolute inset-0",
              heroOverlayClasses[overlay]
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    );
  }
);
OptimizedHeroImage.displayName = "OptimizedHeroImage";

export { OptimizedHeroImage };