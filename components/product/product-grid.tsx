import * as React from "react";
import { cn } from "@/lib/utils";

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

const ProductGrid = React.forwardRef<HTMLDivElement, ProductGridProps>(
  ({ 
    className, 
    cols = 4, 
    spacing = 'md',
    children, 
    ...props 
  }, ref) => {
    
    // Enhanced column mapping with better responsive breakpoints
    const getColumnClasses = (columns: number) => {
      switch (columns) {
        case 1: return "grid-cols-1";
        case 2: return "grid-cols-2";
        case 3: return "grid-cols-2 md:grid-cols-3";
        case 4: return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
        case 5: return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
        case 6: return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
        default: return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      }
    };
    
    // Spacing variants for different layouts
    const getSpacingClasses = (spacing: string) => {
      switch (spacing) {
        case 'sm': return "gap-2";
        case 'md': return "gap-4";
        case 'lg': return "gap-6";
        default: return "gap-4";
      }
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full",
          getColumnClasses(cols),
          getSpacingClasses(spacing),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ProductGrid.displayName = "ProductGrid";

export { ProductGrid };