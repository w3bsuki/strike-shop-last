import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SectionInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  description?: string;
  viewAllText?: string;
  viewAllHref?: string;
  align?: "left" | "center" | "right";
}

const SectionInfo = React.forwardRef<HTMLDivElement, SectionInfoProps>(
  ({ 
    className, 
    description, 
    viewAllText = "VIEW ALL", 
    viewAllHref, 
    align = "left", 
    ...props 
  }, ref) => {
    const alignmentClasses = {
      left: "text-left",
      center: "text-center mx-auto",
      right: "text-right",
    };

    const hasViewAll = viewAllText && viewAllHref;
    
    return (
      <div
        ref={ref}
        className={cn("mb-6 sm:mb-8", className)}
        {...props}
      >
        <div className={cn(
          hasViewAll && align !== "center" && "flex items-start sm:items-end justify-between gap-2 sm:gap-4"
        )}>
          {description && (
            <div className={cn("flex-1", alignmentClasses[align])}>
              <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
                {description}
              </p>
            </div>
          )}
          {hasViewAll && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "group uppercase tracking-wider text-xs sm:text-sm flex-shrink-0 text-muted-foreground hover:text-foreground",
                align === "center" && "mx-auto mt-4"
              )}
            >
              <Link href={viewAllHref}>
                {viewAllText}
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }
);
SectionInfo.displayName = "SectionInfo";

export { SectionInfo };