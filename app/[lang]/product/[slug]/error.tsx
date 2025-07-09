'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// RESILIENCE: Product page error boundary for better UX
export default function ProductError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // MONITORING: Log error to analytics
    console.error('Product page error:', error);
    
    // Send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          digest: error.digest,
          page: 'product',
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
              <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
              <p className="text-muted-foreground mb-6">
                Sorry, we couldn't find the product you're looking for. It may have been moved or is no longer available.
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
                <Button asChild variant="outline">
                  <Link href="/search">
                    Search Products
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Suggested products or categories could go here */}
            <div className="w-full max-w-md">
              <p className="text-sm text-muted-foreground mb-4">
                You might be interested in:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="ghost" className="h-auto p-4">
                  <Link href="/new" className="text-left">
                    <div className="font-medium">New Arrivals</div>
                    <div className="text-sm text-muted-foreground">Latest products</div>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="h-auto p-4">
                  <Link href="/sale" className="text-left">
                    <div className="font-medium">Sale Items</div>
                    <div className="text-sm text-muted-foreground">Discounted products</div>
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