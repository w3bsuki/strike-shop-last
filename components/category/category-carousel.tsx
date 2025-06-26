"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  autoPlay?: boolean;
  duration?: number;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  gap?: "sm" | "default" | "lg";
}

const gapClasses = {
  sm: "gap-3",
  default: "gap-4 md:gap-6",
  lg: "gap-6 md:gap-8",
};

const CategoryCarousel = React.forwardRef<HTMLDivElement, CategoryCarouselProps>(
  (
    {
      className,
      children,
      autoPlay = true,
      duration = 30,
      pauseOnHover = true,
      direction = "left",
      gap = "default",
      ...props
    },
    ref
  ) => {
    const childrenArray = React.Children.toArray(children);
    
    return (
      <div
        ref={ref}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        <motion.div
          className={cn("flex", gapClasses[gap])}
          animate={{
            x: direction === "left" ? [0, "-50%"] : ["-50%", 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
          whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
        >
          {/* Duplicate children for seamless loop */}
          {childrenArray}
          {childrenArray}
        </motion.div>
      </div>
    );
  }
);
CategoryCarousel.displayName = "CategoryCarousel";

export { CategoryCarousel };