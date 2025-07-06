"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const heroDescriptionVariants = cva(
  "text-white/90 font-typewriter tracking-wide leading-relaxed",
  {
    variants: {
      size: {
        sm: "text-sm md:text-base",
        default: "text-base md:text-lg lg:text-xl",
        lg: "text-lg md:text-xl lg:text-2xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface HeroDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof heroDescriptionVariants> {}

const HeroDescription = React.forwardRef<HTMLParagraphElement, HeroDescriptionProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(heroDescriptionVariants({ size }), className)}
        {...props}
      />
    );
  }
);
HeroDescription.displayName = "HeroDescription";

export { HeroDescription, heroDescriptionVariants };