"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { layoutClasses, SPACING } from "@/lib/layout/config";

// PERFECT PRODUCT SCROLL - No variations, always consistent
const productScrollClasses = `flex overflow-x-auto ${SPACING.productGap} pb-1 horizontal-scroll-optimized scrollbar-hide snap-x snap-mandatory`;

export interface ProductScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  showControls?: boolean;
  controlsPosition?: "inside" | "outside";
}

const ProductScroll = React.forwardRef<HTMLDivElement, ProductScrollProps>(
  ({ className, showControls = true, controlsPosition = "outside", children, ...props }, ref) => {
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
      <div className="relative group/scroll">
        <div
          ref={(node) => {
            scrollRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={cn(
            "flex overflow-x-auto gap-4 pb-1 scrollbar-hide snap-x snap-mandatory",
            "[&>*]:flex-shrink-0 [&>*]:w-[180px] [&>*]:snap-start", // Give children consistent width
            className
          )}
          style={{ 
            maxWidth: "100%",
            WebkitOverflowScrolling: "touch"
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
                  "absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-none bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity min-h-[44px] min-w-[44px] touch-manipulation",
                  controlsPosition === "inside" ? "left-6 md:left-8 lg:left-10" : "left-2 md:left-4 lg:left-6"
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
                  "absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-none bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity min-h-[44px] min-w-[44px] touch-manipulation",
                  controlsPosition === "inside" ? "right-6 md:right-8 lg:right-10" : "right-2 md:right-4 lg:right-6"
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

export { ProductScroll };