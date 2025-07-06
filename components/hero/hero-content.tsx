"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const heroContentVariants = cva(
  "relative z-10 flex flex-col gap-4 md:gap-6 px-4 sm:px-6 md:px-8 lg:px-12",
  {
    variants: {
      position: {
        "top-left": "absolute top-0 left-0 pt-16 sm:pt-20 md:pt-32",
        "top-center": "absolute top-0 left-1/2 -translate-x-1/2 pt-16 sm:pt-20 md:pt-32 text-center items-center",
        "top-right": "absolute top-0 right-0 pt-16 sm:pt-20 md:pt-32 text-right items-end",
        "center-left": "absolute top-1/2 left-0 -translate-y-1/2",
        "center": "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center items-center",
        "center-right": "absolute top-1/2 right-0 -translate-y-1/2 text-right items-end",
        "bottom-left": "absolute bottom-0 left-0 pb-8 sm:pb-12 md:pb-20",
        "bottom-center": "absolute bottom-0 left-1/2 -translate-x-1/2 pb-8 sm:pb-12 md:pb-20 text-center items-center",
        "bottom-right": "absolute bottom-0 right-0 pb-8 sm:pb-12 md:pb-20 text-right items-end",
      },
      width: {
        auto: "",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        full: "w-full",
      },
    },
    defaultVariants: {
      position: "bottom-left",
      width: "lg",
    },
  }
);

export interface HeroContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof heroContentVariants> {}

const HeroContent = React.forwardRef<HTMLDivElement, HeroContentProps>(
  ({ className, position, width, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(heroContentVariants({ position, width }), className)}
        {...props}
      />
    );
  }
);
HeroContent.displayName = "HeroContent";

export { HeroContent, heroContentVariants };