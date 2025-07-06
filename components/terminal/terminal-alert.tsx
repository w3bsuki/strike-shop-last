import React from 'react';
import { cn } from '@/lib/utils';
import { terminal } from '@/lib/ascii-art';

interface TerminalAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  title?: string;
  showIcon?: boolean;
  children: React.ReactNode;
}

export const TerminalAlert = React.forwardRef<HTMLDivElement, TerminalAlertProps>(
  ({ 
    className, 
    variant = 'default',
    title,
    showIcon = true,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "border-2 p-4 font-terminal space-y-2";
    
    const variants = {
      default: "bg-terminal-bg text-terminal-green border-terminal-green",
      success: "bg-terminal-green/10 text-terminal-green border-terminal-green",
      warning: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber",
      error: "bg-terminal-red/10 text-terminal-red border-terminal-red",
      info: "bg-terminal-blue/10 text-terminal-blue border-terminal-blue"
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
      <div
        className={cn(
          baseStyles,
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {title && (
          <div className="flex items-center space-x-2">
            {showIcon && (
              <span className="text-lg font-bold">
                {getIcon()}
              </span>
            )}
            <h4 className="font-bold uppercase tracking-wide">
              {title}
            </h4>
          </div>
        )}
        <div className={cn(!title && showIcon && "flex items-start space-x-2")}>
          {!title && showIcon && (
            <span className="text-lg font-bold mt-0.5">
              {getIcon()}
            </span>
          )}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

TerminalAlert.displayName = "TerminalAlert";