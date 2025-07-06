import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroMarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: "slow" | "normal" | "fast";
  pauseOnHover?: boolean;
}

const HeroMarquee = React.forwardRef<HTMLDivElement, HeroMarqueeProps>(
  ({ className, children, speed = "normal", pauseOnHover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute bottom-0 left-0 right-0 overflow-hidden bg-black border-t border-gray-200 text-white py-3 md:py-4",
          className
        )}
        {...props}
      >
        <div className={cn(
          "flex animate-marquee",
          speed === "slow" && "animate-marquee-slow",
          speed === "fast" && "animate-marquee-fast",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}>
          <div className="flex shrink-0 items-center justify-around min-w-full">
            {children}
          </div>
          <div className="flex shrink-0 items-center justify-around min-w-full" aria-hidden="true">
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
  ({ className, children, ...props }, ref) => {
    return (
      <>
        <span
          ref={ref}
          className={cn("text-sm font-primary font-medium uppercase tracking-wider mx-4", className)}
          {...props}
        >
          {children}
        </span>
      </>
    );
  }
);
HeroMarqueeItem.displayName = "HeroMarqueeItem";

export { HeroMarquee, HeroMarqueeItem };