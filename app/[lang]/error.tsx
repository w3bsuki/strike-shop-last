'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ShopErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for shop routes with contextual recovery
 * PERFORMANCE: Prevents error crashes, provides graceful fallbacks
 */
export default function ShopError({ error, reset }: ShopErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Shop page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">
            We're having trouble loading this page. This might be a temporary issue.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}