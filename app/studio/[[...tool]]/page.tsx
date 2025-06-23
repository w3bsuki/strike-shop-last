/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * BUNDLE OPTIMIZATION: Sanity Studio is 104MB - lazy loaded to reduce initial bundle
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// export const dynamic = 'force-dynamic'; // Changed to dynamic for lazy loading

export { metadata, viewport } from 'next-sanity/studio';

// CRITICAL OPTIMIZATION: Lazy load entire Sanity Studio (104MB package)
const StudioWrapper = dynamic(
  () => import('@/components/studio/StudioWrapper').then(mod => ({ default: mod.StudioWrapper })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    ),
    ssr: false, // Studio doesn't need SSR
  }
);

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Sanity Studio...</p>
        </div>
      </div>
    }>
      <StudioWrapper />
    </Suspense>
  );
}
