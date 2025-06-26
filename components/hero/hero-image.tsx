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
          className={cn("hidden md:block absolute inset-0", className)} 
          style={{ aspectRatio: aspectRatioDesktop }}
          {...props}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            priority={priority}
            sizes="100vw"
            quality={90}
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
        
        {/* Mobile hero with portrait aspect ratio */}
        <div 
          className={cn("md:hidden absolute inset-0", className)} 
          style={{ aspectRatio: aspectRatioMobile }}
          {...props}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            priority={priority}
            sizes="100vw"
            quality={90}
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
      </>
    );
  }
);
HeroImage.displayName = "HeroImage";

export { HeroImage };