'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// RESILIENCE: Category page error boundary for better UX
export default function CategoryError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // MONITORING: Log error to analytics
    console.error('Category page error:', error);
    
    // Send error to monitoring service
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
          page: 'category',
          timestamp: Date.now(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border h-14" />
      
      <div className="section-padding">
        <div className="strike-container">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-4">Category Not Available</h1>
              <p className="text-muted-foreground mb-6">
                Sorry, we're having trouble loading this category. Please try again or browse our other collections.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={reset} variant="default">
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Category suggestions */}
            <div className="w-full max-w-2xl">
              <p className="text-sm text-muted-foreground mb-4">
                Browse our popular categories:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="ghost" className="h-auto p-4">
                  <Link href="/men" className="text-center">
                    <div className="font-medium">Men</div>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="h-auto p-4">
                  <Link href="/women" className="text-center">
                    <div className="font-medium">Women</div>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="h-auto p-4">
                  <Link href="/new" className="text-center">
                    <div className="font-medium">New</div>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="h-auto p-4">
                  <Link href="/sale" className="text-center">
                    <div className="font-medium">Sale</div>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}