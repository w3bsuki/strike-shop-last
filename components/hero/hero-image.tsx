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
          "absolute inset-0 w-full h-full bg-gray-900",
          className
        )} 
        {...props}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center mix-blend-multiply opacity-80"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          quality={90}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
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
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    );
  }
);
HeroImage.displayName = "HeroImage";

export { HeroImage };