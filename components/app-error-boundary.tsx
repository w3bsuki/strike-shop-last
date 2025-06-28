'use client';

import { ErrorBoundary, AsyncErrorBoundary } from '@/components/error-boundary';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log critical errors for production monitoring
        console.error('App-level error:', error, errorInfo);
        
        // Send to monitoring service in production
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
          // Integration point for error tracking service
          // analytics.capture('error', { error: error.message, stack: error.stack });
        }
      }}
    >
      <AsyncErrorBoundary>
        {children}
      </AsyncErrorBoundary>
    </ErrorBoundary>
  );
}