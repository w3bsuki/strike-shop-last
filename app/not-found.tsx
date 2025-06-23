'use client';

import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="text-6xl font-bold text-muted-foreground mb-4">
            404
          </div>
          <h1 className="text-heading-lg mb-2">Page not found</h1>
          <p className="text-body-sm text-muted-foreground">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="strike" size="strike" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go home
            </Button>
          </Link>

          <Link href="/search" className="block">
            <Button variant="strike-outline" size="strike" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search products
            </Button>
          </Link>

          <Button
            onClick={() => window.history.back()}
            variant="strike-text"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-caption">
            Need help? Contact our{' '}
            <Link href="/support" className="text-primary hover:underline">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
