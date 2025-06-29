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
}

const HeroImage = React.forwardRef<HTMLDivElement, HeroImageProps>(
  ({ 
    className, 
    src, 
    alt, 
    overlay = "gradient", 
    priority = true, 
    children, 
    ...props 
  }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(
          "relative w-full h-full overflow-hidden",
          className
        )} 
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
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);
HeroImage.displayName = "HeroImage";

export { HeroImage };