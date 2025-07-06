import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getLoadingFrame, spinners } from '@/lib/ascii-art';

interface TerminalLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: keyof typeof spinners;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showText?: boolean;
}

export const TerminalLoading = React.forwardRef<HTMLDivElement, TerminalLoadingProps>(
  ({ 
    className, 
    type = 'dots',
    size = 'md', 
    text = "Loading",
    showText = true,
    ...props 
  }, ref) => {
    const [frame, setFrame] = useState(0);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setFrame(prev => prev + 1);
      }, 100);
      
      return () => clearInterval(interval);
    }, []);

    const baseStyles = "inline-flex items-center font-terminal text-terminal-green";
    
    const sizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg"
    };

    const currentSpinner = getLoadingFrame(frame, type);

    return (
      <div
        className={cn(
          baseStyles,
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="mr-2 inline-block w-4 text-center">
          {currentSpinner}
        </span>
        {showText && (
          <span className="uppercase tracking-wide">
            {text}...
          </span>
        )}
      </div>
    );
  }
);

TerminalLoading.displayName = "TerminalLoading";