import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'inline';
}

export function ErrorMessage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  showHomeButton = true,
  showBackButton = false,
  className,
  variant = 'default',
}: ErrorMessageProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('text-center py-8', className)}>
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-[400px] items-center justify-center p-4', className)}>
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex justify-center gap-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          {showBackButton && (
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}

          {showHomeButton && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
              Error Details
            </summary>
            <div className="mt-2 rounded-lg bg-muted p-4">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// Specific error message variants
export function ProductNotFoundError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Product Not Found"
      message="The product you're looking for doesn't exist or has been removed."
      {...(onRetry && { onRetry })}
      showHomeButton
      showBackButton
    />
  );
}

export function CartError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Cart Error"
      message="There was a problem with your cart. Please try again."
      {...(onRetry && { onRetry })}
      variant="minimal"
    />
  );
}

export function CheckoutError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Checkout Error"
      message="We couldn't process your checkout. Please try again or contact support."
      {...(onRetry && { onRetry })}
      showHomeButton={false}
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Please check your internet connection and try again."
      {...(onRetry && { onRetry })}
      showHomeButton={false}
    />
  );
}