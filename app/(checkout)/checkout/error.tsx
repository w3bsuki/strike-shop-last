'use client';

import { useEffect } from 'react';
import { ErrorMessage } from '@/components/ui/error-message';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to analytics
    console.error('Checkout error:', error);
    
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
          page: 'checkout',
          timestamp: Date.now(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail
      });
    }
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <ErrorMessage
          title="Checkout Error"
          message="We couldn't process your checkout. Please try again or contact support if the problem persists."
          error={error}
          onRetry={reset}
          showHomeButton
          showBackButton
        />
      </main>
      <Footer />
    </>
  );
}