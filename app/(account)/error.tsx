'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut, RefreshCw, Home } from 'lucide-react';

interface AccountErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for account routes with auth-specific recovery
 * PERFORMANCE: Handles auth failures gracefully
 */
export default function AccountError({ error, reset }: AccountErrorProps) {
  useEffect(() => {
    console.error('Account page error:', error);
  }, [error]);

  const handleSignOut = () => {
    // Clear auth state and redirect to sign-in
    window.location.href = '/sign-in';
  };

  const isAuthError = error.message.includes('Unauthorized') || 
                     error.message.includes('authentication') ||
                     error.message.includes('session');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isAuthError ? 'Authentication Issue' : 'Account Error'}
          </h1>
          
          <p className="text-gray-600">
            {isAuthError 
              ? 'Your session may have expired. Please sign in again to access your account.'
              : 'We are having trouble loading your account information. This might be a temporary issue.'
            }
          </p>
        </div>

        <div className="space-y-3">
          {isAuthError ? (
            <>
              <Button 
                onClick={handleSignOut}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign In Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={reset}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out & Retry
              </Button>
            </>
          )}
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