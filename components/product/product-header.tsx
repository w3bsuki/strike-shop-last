import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductBadge } from "./product-badge";

interface ProductHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  viewAllText?: string;
  viewAllHref?: string;
  align?: "left" | "center" | "right";
  badge?: React.ReactNode;
  badgeText?: string;
  badgeVariant?: "sale" | "new" | "soldOut" | "limited" | "exclusive";
}

const ProductHeader = React.forwardRef<HTMLDivElement, ProductHeaderProps>(
  ({ 
    className, 
    title, 
    description, 
    viewAllText = "VIEW ALL", 
    viewAllHref, 
    align = "left", 
    badge, 
    badgeText,
    badgeVariant = "new",
    ...props 
  }, ref) => {
    const alignmentClasses = {
      left: "text-left",
      center: "text-center mx-auto",
      right: "text-right",
    };

    const hasViewAll = viewAllText && viewAllHref;
    
    // Create integrated badge if badgeText is provided
    const integratedBadge = badgeText ? (
      <ProductBadge variant={badgeVariant} size="sm" className="ml-3">
        {badgeText}
      </ProductBadge>
    ) : badge;

    return (
      <div
        ref={ref}
        className={cn("mb-6 sm:mb-8 md:mb-10", className)}
        {...props}
      >
        <div className={cn(
          hasViewAll && align !== "center" && "flex items-start sm:items-end justify-between gap-2 sm:gap-4"
        )}>
          <div className={cn("flex-1", alignmentClasses[align])}>
            {title && (
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight uppercase leading-tight font-typewriter">
                {title}
              </h2>
            )}
          </div>
          {hasViewAll && align !== "center" && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "group uppercase tracking-wider text-xs sm:text-sm flex-shrink-0 text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={viewAllHref}>
                {viewAllText}
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
        </div>
        {hasViewAll && align === "center" && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="group uppercase tracking-wider text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              <Link href={viewAllHref}>
                {viewAllText}
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        )}
        {description && (
          <p className={cn(
            "mt-2 text-muted-foreground text-xs sm:text-sm md:text-base max-w-3xl font-professional",
            align === "center" && "mx-auto text-center"
          )}>
            {description}
          </p>
        )}
        {badge && (
          <div className={cn(
            "mt-4 flex",
            align === "center" && "justify-center",
            align === "right" && "justify-end"
          )}>
            {badge}
          </div>
        )}
      </div>
    );
  }
);
ProductHeader.displayName = "ProductHeader";

export { ProductHeader };