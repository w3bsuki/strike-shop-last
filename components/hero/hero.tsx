"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { heroSizeClasses, type HeroSize } from "@/config/hero";

interface HeroProps extends React.HTMLAttributes<HTMLElement> {
  size?: HeroSize;
  asChild?: boolean;
}

const Hero = React.forwardRef<HTMLElement, HeroProps>(
  ({ className, size = "default", asChild = false, children, ...props }, ref) => {
    const containerProps = asChild ? {} : props;

    if (asChild) {
      return <>{children}</>;
    }

    return (
      <section
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden",
          // CSS containment for layout stability
          "contain-layout contain-style",
          // Prevent zoom effects on mobile
          "transform-gpu backface-visibility-hidden",
          heroSizeClasses[size],
          className
        )}
        style={{
          // Prevent layout shifts and zoom effects
          contain: 'layout style size',
          isolation: 'isolate',
          willChange: 'auto'
        }}
        {...containerProps}
      >
        {children}
      </section>
    );
  }
);
Hero.displayName = "Hero";

export { Hero };