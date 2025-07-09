'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface CollectionsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for collections page with navigation fallback
 * PERFORMANCE: Graceful fallback for API failures
 */
export default function CollectionsError({ error, reset }: CollectionsErrorProps) {
  useEffect(() => {
    console.error('Collections page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="section-padding border-b border-subtle">
        <div className="strike-container">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </section>

      {/* Error Content */}
      <section className="section-padding">
        <div className="strike-container text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Collections
            </h1>
            
            <p className="text-gray-600 mb-8">
              We're having trouble loading our collections right now. 
              This might be a temporary issue with our servers.
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
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Browse All Products
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Fallback Content - Popular Categories */}
      <section className="section-padding bg-gray-50">
        <div className="strike-container text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Popular Categories
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Clothing', 'Accessories', 'Footwear', 'Home'].map((category) => (
              <Button 
                key={category}
                variant="outline" 
                onClick={() => window.location.href = `/${category.toLowerCase()}`}
                className="h-auto py-4"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}