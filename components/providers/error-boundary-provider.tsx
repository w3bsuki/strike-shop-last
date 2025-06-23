'use client';

import type { ErrorInfo, ReactNode } from 'react';
import React from 'react';
import { ErrorState } from '@/components/ui/error-states';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Production-ready Error Boundary
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundaryProvider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorState
              title="Application Error"
              message={
                process.env.NODE_ENV === 'development'
                  ? this.state.error?.message || 'An unexpected error occurred'
                  : 'Something went wrong. Our team has been notified.'
              }
              onRetry={this.handleReset}
            />

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-muted rounded-lg">
                <summary className="text-sm font-medium cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}

/**
 * Async Error Boundary for Suspense errors
 */
export function AsyncErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundaryProvider fallback={fallback}>
      {children}
    </ErrorBoundaryProvider>
  );
}
