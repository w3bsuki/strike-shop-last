"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroMarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: "slow" | "normal" | "fast";
  pauseOnHover?: boolean;
}

const speedClasses = {
  slow: "animate-marquee-slow",
  normal: "animate-marquee",
  fast: "animate-marquee-fast",
};

const HeroMarquee = React.forwardRef<HTMLDivElement, HeroMarqueeProps>(
  ({ className, children, speed = "normal", pauseOnHover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute bottom-0 left-0 right-0 overflow-hidden bg-black text-white py-3 md:py-4",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex whitespace-nowrap",
            speedClasses[speed],
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
        >
          <div className="flex items-center space-x-8 px-4">
            {children}
          </div>
          <div className="flex items-center space-x-8 px-4" aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
HeroMarquee.displayName = "HeroMarquee";

interface HeroMarqueeItemProps extends React.HTMLAttributes<HTMLSpanElement> {}

const HeroMarqueeItem = React.forwardRef<HTMLSpanElement, HeroMarqueeItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("text-sm font-medium uppercase tracking-wider", className)}
        {...props}
      />
    );
  }
);
HeroMarqueeItem.displayName = "HeroMarqueeItem";

export { HeroMarquee, HeroMarqueeItem };