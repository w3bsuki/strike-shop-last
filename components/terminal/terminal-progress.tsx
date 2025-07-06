import React from 'react';
import { cn } from '@/lib/utils';
import { createProgressBar } from '@/lib/ascii-art';

interface TerminalProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showPercentage?: boolean;
  showValue?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TerminalProgress = React.forwardRef<HTMLDivElement, TerminalProgressProps>(
  ({ 
    className, 
    value,
    max = 100,
    showPercentage = true,
    showValue = false,
    label,
    size = 'md',
    ...props 
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const baseStyles = "font-terminal text-terminal-green space-y-1";
    
    const sizes = {
      sm: { width: 20, text: "text-sm" },
      md: { width: 30, text: "text-base" },
      lg: { width: 40, text: "text-lg" }
    };

    const progressBar = createProgressBar(percentage, sizes[size].width);

    return (
      <div
        className={cn(
          baseStyles,
          sizes[size].text,
          className
        )}
        ref={ref}
        {...props}
      >
        {label && (
          <div className="uppercase tracking-wide font-medium">
            {label}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <span className="font-mono">
            {progressBar}
          </span>
          {(showPercentage || showValue) && (
            <span className="text-terminal-green-dim">
              {showValue ? `${value}/${max}` : `${Math.round(percentage)}%`}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TerminalProgress.displayName = "TerminalProgress";