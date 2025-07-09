'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for auth routes with contextual recovery
 * PERFORMANCE: Handles auth flow errors gracefully
 */
export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    console.error('Auth page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Error Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>
          
          <p className="text-gray-600 mb-8">
            We're having trouble with the authentication process. 
            This might be a temporary issue.
          </p>

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
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>

        {/* Support Information */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Still having trouble? {' '}
            <a 
              href="/contact" 
              className="text-black hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
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