import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import SearchPageClient from './SearchPageClient';
import { shopifyService } from '@/lib/shopify';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';
  const category = resolvedSearchParams.category || '';
  
  let title = 'Search Products - STRIKE™';
  let description = 'Search our premium streetwear collection and find exactly what you\'re looking for.';
  
  if (query) {
    title = `"${query}" - Search Results | STRIKE™`;
    description = `Search results for "${query}". Find premium streetwear and luxury fashion at STRIKE™.`;
  }
  
  if (category) {
    title = `${category} - Search Results | STRIKE™`;
    description = `Browse our ${category} collection. Premium streetwear and luxury fashion.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = resolvedSearchParams.q || '';
  
  // Server-side search for initial load (SEO + performance)
  let initialProducts: any[] = [];
  if (initialQuery) {
    try {
      initialProducts = await shopifyService.searchProducts(initialQuery);
    } catch (error) {
      console.error('Initial search error:', error);
    }
  }
  
  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageClient 
          initialQuery={initialQuery}
          initialProducts={initialProducts}
        />
      </Suspense>
      <Footer />
    </main>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Box Skeleton */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="h-12 bg-gray-200 animate-pulse rounded-lg" />
      </div>
      
      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
      </div>
      
      {/* Content Skeleton */}
      <div className="flex gap-8">
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:block w-64">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 animate-pulse rounded w-20" />
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-3 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        
        {/* Results Skeleton */}
        <main className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}