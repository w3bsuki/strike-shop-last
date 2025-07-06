'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorMessage, ProductNotFoundError, CartError, CheckoutError, NetworkError } from '@/components/ui/error-message';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';

interface ShopErrorBoundaryProps {
  children: React.ReactNode;
  context?: 'product' | 'cart' | 'checkout' | 'general';
  showNavigation?: boolean;
}

export function ShopErrorBoundary({ 
  children, 
  context = 'general',
  showNavigation = true 
}: ShopErrorBoundaryProps) {
  const getContextualError = (error: Error, retry: () => void) => {
    // Check error type and context to provide specific error components
    const isNetworkError = error.message.includes('fetch') || 
                          error.message.includes('network') ||
                          error.message.includes('connection');
    
    if (isNetworkError) {
      return <NetworkError onRetry={retry} />;
    }

    switch (context) {
      case 'product':
        if (error.message.includes('not found') || error.message.includes('404')) {
          return <ProductNotFoundError onRetry={retry} />;
        }
        break;
      case 'cart':
        return <CartError onRetry={retry} />;
      case 'checkout':
        return <CheckoutError onRetry={retry} />;
    }

    // Default error message
    return (
      <ErrorMessage
        title="Something went wrong"
        message="We encountered an unexpected error. Please try again."
        error={error}
        onRetry={retry}
        showHomeButton
        showBackButton
      />
    );
  };

  const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => {
    const errorComponent = getContextualError(error, retry);

    if (showNavigation) {
      return (
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">
            {errorComponent}
          </main>
          <Footer />
        </div>
      );
    }

    return errorComponent;
  };

  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error with context
        console.error(`Error in ${context} boundary:`, error);
        
        // Send to error tracking service
        if (process.env.NODE_ENV === 'production') {
          fetch('/api/monitoring/errors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              error: error.message,
              stack: error.stack,
              context,
              componentStack: errorInfo.componentStack,
              timestamp: Date.now(),
            }),
            keepalive: true,
          }).catch(() => {
            // Silently fail
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Specialized error boundaries for different sections
export function ProductErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ShopErrorBoundary context="product" showNavigation={false}>
      {children}
    </ShopErrorBoundary>
  );
}

export function CartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ShopErrorBoundary context="cart" showNavigation={false}>
      {children}
    </ShopErrorBoundary>
  );
}

export function CheckoutErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ShopErrorBoundary context="checkout" showNavigation={false}>
      {children}
    </ShopErrorBoundary>
  );
}

// Higher-order component for wrapping pages
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context: 'product' | 'cart' | 'checkout' | 'general' = 'general'
) {
  return function WrappedComponent(props: P) {
    return (
      <ShopErrorBoundary context={context}>
        <Component {...props} />
      </ShopErrorBoundary>
    );
  };
}