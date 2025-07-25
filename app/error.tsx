'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service

  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-heading-lg mb-2 font-typewriter font-bold">Something went wrong!</h1>
          <p className="text-body-sm text-muted-foreground mb-6 font-typewriter">
            We encountered an unexpected error. Our team has been notified and
            is working on a fix.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={reset}
            variant="strike"
            size="strike"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            TRY AGAIN
          </Button>

          <Link href="/" className="block">
            <Button variant="strike-outline" size="strike" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              GO HOME
            </Button>
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-label-sm cursor-pointer mb-2 font-typewriter font-bold">
              Error Details (Development)
            </summary>
            <pre className="text-xs bg-secondary p-4 rounded border overflow-auto font-typewriter">
              {error.message}
              {error.stack && (
                <>
                  {'\n\nStack trace:\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
