"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";

const productScrollVariants = cva(
  "flex overflow-x-auto overflow-y-visible gap-3 md:gap-4 pb-1 horizontal-scroll-optimized scrollbar-hide",
  {
    variants: {
      gap: {
        sm: "gap-2 md:gap-3",
        default: "gap-3 md:gap-4",
        lg: "gap-4 md:gap-6",
      },
    },
    defaultVariants: {
      gap: "default",
    },
  }
);

export interface ProductScrollProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productScrollVariants> {
  showControls?: boolean;
  controlsPosition?: "inside" | "outside";
}

const ProductScroll = React.forwardRef<HTMLDivElement, ProductScrollProps>(
  ({ className, gap, showControls = true, controlsPosition = "outside", children, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    const checkScrollability = React.useCallback(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    }, []);

    React.useEffect(() => {
      checkScrollability();
      window.addEventListener("resize", checkScrollability);
      return () => window.removeEventListener("resize", checkScrollability);
    }, [checkScrollability, children]);

    const scroll = React.useCallback((direction: "left" | "right") => {
      if (scrollRef.current) {
        const scrollAmount = scrollRef.current.clientWidth * 0.75;
        scrollRef.current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
        setTimeout(checkScrollability, 350);
      }
    }, [checkScrollability]);

    return (
      <div className="relative group">
        <div
          ref={(node) => {
            scrollRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={cn(productScrollVariants({ gap }), className)}
          style={{ 
            maxWidth: "100%",
            touchAction: "pan-x", // Only allow horizontal scroll on touch
            overscrollBehaviorX: "contain",
            overscrollBehaviorY: "none",
            WebkitOverflowScrolling: "touch" // iOS momentum scrolling
          }}
          onScroll={checkScrollability}
          {...props}
        >
          {children}
        </div>

        {/* Scroll Controls */}
        {showControls && (
          <>
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll("left")}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-none bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] touch-manipulation",
                  controlsPosition === "inside" ? "left-2" : "-left-4"
                )}
                aria-label="Scroll left"
                onTouchStart={(e) => e.stopPropagation()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll("right")}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-none bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] touch-manipulation",
                  controlsPosition === "inside" ? "right-2" : "-right-4"
                )}
                aria-label="Scroll right"
                onTouchStart={(e) => e.stopPropagation()}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </>
        )}
      </div>
    );
  }
);
ProductScroll.displayName = "ProductScroll";

export { ProductScroll, productScrollVariants };