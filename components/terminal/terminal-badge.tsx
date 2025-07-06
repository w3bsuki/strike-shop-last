import React from 'react';
import { cn } from '@/lib/utils';
import { terminal } from '@/lib/ascii-art';

interface TerminalBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children: React.ReactNode;
}

export const TerminalBadge = React.forwardRef<HTMLSpanElement, TerminalBadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    showIcon = false,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center font-terminal font-medium uppercase tracking-wide border-2";
    
    const variants = {
      default: "bg-terminal-bg text-terminal-green border-terminal-green",
      success: "bg-terminal-green text-terminal-bg border-terminal-green",
      warning: "bg-terminal-amber text-terminal-bg border-terminal-amber",
      error: "bg-terminal-red text-white border-terminal-red",
      info: "bg-terminal-blue text-white border-terminal-blue"
    };
    
    const sizes = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-2 text-base"
    };

    const getIcon = () => {
      switch (variant) {
        case 'success':
          return terminal.checkmark;
        case 'error':
          return terminal.cross;
        case 'warning':
          return '!';
        case 'info':
          return 'i';
        default:
          return terminal.bulletPoint;
      }
    };

    return (
      <span
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {showIcon && (
          <span className="mr-1">
            {getIcon()}
          </span>
        )}
        {children}
      </span>
    );
  }
);

TerminalBadge.displayName = "TerminalBadge";