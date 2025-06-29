"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { heroOverlayClasses, type HeroOverlay } from "@/config/hero";

interface HeroImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  overlay?: HeroOverlay;
  priority?: boolean;
  aspectRatioDesktop?: string;
  aspectRatioMobile?: string;
}

const HeroImage = React.forwardRef<HTMLDivElement, HeroImageProps>(
  ({ 
    className, 
    src, 
    alt, 
    overlay = "gradient", 
    priority = true, 
    aspectRatioDesktop = "16/9",
    aspectRatioMobile = "4/5",
    children, 
    ...props 
  }, ref) => {
    return (
      <>
        {/* Desktop hero with landscape aspect ratio */}
        <div 
          ref={ref} 
          className={cn(
            "hidden md:block relative w-full h-full",
            // Prevent zoom/extension effects
            "overflow-hidden",
            // CSS containment for performance and stability
            "contain-layout contain-style contain-paint",
            className
          )} 
          style={{ 
            aspectRatio: aspectRatioDesktop,
            // Prevent layout shifts during scroll
            contain: 'layout style size paint',
            isolation: 'isolate',
            willChange: 'auto'
          }}
          {...props}
        >
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-center"
              priority={priority}
              sizes="(max-width: 768px) 100vw, 100vw"
              quality={90}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                // Prevent image zoom during scroll
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
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
                // Ensure overlay doesn't cause layout shifts
                contain: 'layout style',
                isolation: 'isolate'
              }}
            />
          )}
          <div className="relative z-20">
            {children}
          </div>
        </div>
        
        {/* Mobile hero with portrait aspect ratio */}
        <div 
          className={cn(
            "md:hidden relative w-full h-full",
            // Mobile-specific scroll optimizations
            "overflow-hidden",
            // Enhanced containment for mobile
            "contain-layout contain-style contain-paint",
            className
          )} 
          style={{ 
            aspectRatio: aspectRatioMobile,
            // Mobile-specific layout stability
            contain: 'layout style size paint',
            isolation: 'isolate',
            willChange: 'auto',
            // Prevent iOS scroll bounce effects
            WebkitOverflowScrolling: 'auto',
            overscrollBehavior: 'none'
          }}
          {...props}
        >
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-center"
              priority={priority}
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={90}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                // Mobile-specific image stabilization
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                // Prevent zoom effects on mobile scroll
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
                // Mobile overlay stability
                contain: 'layout style',
                isolation: 'isolate'
              }}
            />
          )}
          <div className="relative z-20">
            {children}
          </div>
        </div>
      </>
    );
  }
);
HeroImage.displayName = "HeroImage";

export { HeroImage };