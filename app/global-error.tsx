'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// RESILIENCE: Global error boundary for critical errors
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // CRITICAL: Log global errors
    console.error('Global error:', error);
    
    // Send critical error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          digest: error.digest,
          page: 'global',
          critical: true,
          timestamp: Date.now(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We're experiencing technical difficulties. Please try refreshing the page.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={reset} variant="default">
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
              >
                Go Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm">Error Details</summary>
                <pre className="mt-2 p-4 bg-secondary rounded text-xs overflow-auto">
                  {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}