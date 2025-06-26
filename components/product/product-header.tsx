"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  viewAllText?: string;
  viewAllHref?: string;
  align?: "left" | "center" | "right";
  badge?: React.ReactNode;
}

const ProductHeader = React.forwardRef<HTMLDivElement, ProductHeaderProps>(
  ({ className, title, description, viewAllText = "VIEW ALL", viewAllHref, align = "left", badge, ...props }, ref) => {
    const alignmentClasses = {
      left: "text-left",
      center: "text-center mx-auto",
      right: "text-right",
    };

    const hasViewAll = viewAllText && viewAllHref;

    return (
      <div
        ref={ref}
        className={cn(
          "mb-6 sm:mb-8 md:mb-12",
          hasViewAll && align !== "center" && "flex items-start sm:items-end justify-between gap-2 sm:gap-4",
          className
        )}
        {...props}
      >
        <div className={cn("flex-1", alignmentClasses[align])}>
          <div className="flex items-center gap-3">
            {title && (
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-tight">
                {title}
              </h2>
            )}
            {badge}
          </div>
          {description && (
            <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-2xl hidden sm:block">
              {description}
            </p>
          )}
        </div>
        {hasViewAll && (
          <Button
            variant={align === "center" ? "outline" : "ghost"}
            size="sm"
            asChild
            className={cn(
              "group uppercase tracking-wider text-xs sm:text-sm flex-shrink-0 self-start sm:self-end",
              align === "center" && "mx-auto mt-4"
            )}
          >
            <Link href={viewAllHref}>
              {viewAllText}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        )}
      </div>
    );
  }
);
ProductHeader.displayName = "ProductHeader";

export { ProductHeader };