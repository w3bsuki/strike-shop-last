import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroTerminalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  showScanLines?: boolean;
  showMatrixRain?: boolean;
}

const HeroTerminalOverlay = React.forwardRef<HTMLDivElement, HeroTerminalOverlayProps>(
  ({ className, showScanLines = true, showMatrixRain = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 pointer-events-none",
          className
        )}
        {...props}
      >
        {/* Terminal scan lines effect */}
        {showScanLines && (
          <div className="absolute inset-0 opacity-10">
            {/* Horizontal scan lines */}
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.1) 2px,
                  rgba(0, 255, 0, 0.1) 4px
                )`
              }}
            />
            {/* Moving scan line */}
            <div className="absolute inset-0">
              <div 
                className="w-full h-1 bg-terminal-green opacity-20 animate-terminal-scan"
                style={{
                  boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Terminal border effect */}
        <div className="absolute inset-0 border-2 border-terminal-green opacity-20" />
        
        {/* Corner brackets */}
        <div className="absolute top-4 left-4">
          <div className="w-8 h-8 border-l-2 border-t-2 border-terminal-green opacity-60" />
        </div>
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 border-r-2 border-t-2 border-terminal-green opacity-60" />
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="w-8 h-8 border-l-2 border-b-2 border-terminal-green opacity-60" />
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="w-8 h-8 border-r-2 border-b-2 border-terminal-green opacity-60" />
        </div>
      </div>
    );
  }
);

HeroTerminalOverlay.displayName = "HeroTerminalOverlay";

export { HeroTerminalOverlay };