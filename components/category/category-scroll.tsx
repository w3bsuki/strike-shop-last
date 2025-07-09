"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CategoryScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  showControls?: boolean;
  controlsPosition?: "inside" | "outside";
  gap?: "sm" | "default" | "lg";
}

const gapClasses = {
  sm: "gap-3",
  default: "gap-4 md:gap-6",
  lg: "gap-6 md:gap-8",
};

const CategoryScroll = React.forwardRef<HTMLDivElement, CategoryScrollProps>(
  ({ className, children, showControls = true, controlsPosition = "outside", gap = "default", ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(true);

    const checkScroll = React.useCallback(() => {
      const container = scrollRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    React.useEffect(() => {
      checkScroll();
      const container = scrollRef.current;
      if (!container) return;

      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }, [checkScroll]);

    const scroll = (direction: "left" | "right") => {
      const container = scrollRef.current;
      if (!container) return;

      const scrollAmount = container.clientWidth * 0.8;
      const targetScroll = container.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);

      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className={cn(
            "flex overflow-x-auto scrollbar-none scroll-smooth",
            gapClasses[gap]
          )}
        >
          {children}
        </div>

        {/* Scroll Controls */}
        {showControls && (
          <>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg",
                controlsPosition === "inside" ? "left-4" : "left-0",
                !canScrollLeft && "hidden"
              )}
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg",
                controlsPosition === "inside" ? "right-4" : "right-0",
                !canScrollRight && "hidden"
              )}
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Fade Edges */}
        {showControls && controlsPosition === "inside" && (
          <>
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10",
                !canScrollLeft && "hidden"
              )}
            />
            <div
              className={cn(
                "absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10",
                !canScrollRight && "hidden"
              )}
            />
          </>
        )}
      </div>
    );
  }
);
CategoryScroll.displayName = "CategoryScroll";

export { CategoryScroll };