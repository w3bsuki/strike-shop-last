"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const heroBadgeVariants = cva(
  "inline-flex items-center rounded-none px-3 py-1 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-white text-black",
        outline: "border border-white text-white",
        destructive: "bg-red-600 text-white",
        secondary: "bg-white/20 text-white backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface HeroBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof heroBadgeVariants> {}

const HeroBadge = React.forwardRef<HTMLDivElement, HeroBadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(heroBadgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
HeroBadge.displayName = "HeroBadge";

export { HeroBadge, heroBadgeVariants };