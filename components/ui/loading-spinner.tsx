// Loading Spinner Component
// Reusable loading spinner for UI states

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
  children?: React.ReactNode;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  color = 'primary',
  children 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-primary border-primary',
    secondary: 'text-secondary border-secondary',
    muted: 'text-muted-foreground border-muted-foreground'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-solid border-t-transparent',
            sizeClasses[size],
            colorClasses[color],
            'border-opacity-20'
          )}
          style={{
            borderTopColor: 'transparent',
            borderRightColor: 'currentColor',
            borderBottomColor: 'currentColor',
            borderLeftColor: 'currentColor',
            borderRightWidth: '1px',
            borderBottomWidth: '1px', 
            borderLeftWidth: '1px'
          }}
        />
        {children && (
          <div className="text-sm text-muted-foreground">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}