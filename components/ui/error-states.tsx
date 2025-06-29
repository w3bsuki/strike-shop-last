import React from 'react';
import { AlertCircle, XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

/**
 * Generic Error State
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  showHomeButton = true,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <XCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-bold uppercase tracking-wider mb-2">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{message}</p>
      <div className="flex gap-4">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {showHomeButton && (
          <Button asChild variant="default" size="sm">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Product Not Found
 */
export function ProductNotFound() {
  return (
    <ErrorState
      title="Product Not Found"
      message="The product you're looking for doesn't exist or has been removed."
    />
  );
}

/**
 * Cart Error
 */
export function CartError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Cart Error</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span>Failed to update cart. Please try again.</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Empty State
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-sm font-bold uppercase tracking-wider mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{message}</p>
      )}
      {action &&
        (action.href ? (
          <Button asChild variant="default" size="sm">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick} variant="default" size="sm">
            {action.label}
          </Button>
        ))}
    </div>
  );
}

/**
 * Network Error
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Please check your internet connection and try again."
      {...(onRetry && { onRetry })}
      showHomeButton={false}
    />
  );
}

/**
 * Permission Error
 */
export function PermissionError() {
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to view this content."
    />
  );
}

/**
 * Inline Error Message
 */
export function InlineError({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm text-destructive ${className}`}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Form Field Error
 */
export function FieldError({
  error,
}: {
  error?: string | { message?: string };
}) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;

  if (!message) return null;

  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

/**
 * API Error Handler
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }

  return 'An unexpected error occurred';
}
