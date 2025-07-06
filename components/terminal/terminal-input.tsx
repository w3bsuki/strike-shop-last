import React from 'react';
import { cn } from '@/lib/utils';
import { terminal } from '@/lib/ascii-art';

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showPrompt?: boolean;
  showCursor?: boolean;
  label?: string;
  error?: string;
}

export const TerminalInput = React.forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ 
    className, 
    showPrompt = false,
    showCursor = false,
    label,
    error,
    ...props 
  }, ref) => {
    const baseStyles = "w-full bg-terminal-bg text-terminal-green border-2 border-terminal-green font-terminal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 focus:ring-offset-terminal-bg disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-terminal-green/50";

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-terminal font-medium text-terminal-green uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {showPrompt && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-green pointer-events-none">
              {terminal.prompt}
            </span>
          )}
          <input
            className={cn(
              baseStyles,
              showPrompt && "pl-8",
              error && "border-terminal-red focus:ring-terminal-red",
              className
            )}
            ref={ref}
            {...props}
          />
          {showCursor && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 inline-block w-2 h-4 bg-terminal-green animate-terminal-blink">
              {terminal.cursor}
            </span>
          )}
        </div>
        {error && (
          <p className="text-sm text-terminal-red font-terminal">
            {terminal.cross} {error}
          </p>
        )}
      </div>
    );
  }
);

TerminalInput.displayName = "TerminalInput";