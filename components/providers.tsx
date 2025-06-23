'use client';

import { ClerkProvider } from '@/lib/clerk-mock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useState, useEffect } from 'react';
import { AriaProvider } from '@/components/accessibility/aria-helpers';
import { ColorContrastProvider } from '@/components/accessibility/color-contrast-system';
import { FocusManagerProvider } from '@/components/accessibility/enhanced-focus-manager';
import { LiveRegionProvider } from '@/components/accessibility/live-region';

// CRITICAL: Lazy load ReactQueryDevtools to avoid 500KB+ bundle impact
let ReactQueryDevtools: any = () => null;

if (process.env.NODE_ENV === 'development') {
  ReactQueryDevtools = dynamic(
    () => import('@tanstack/react-query-devtools').then(mod => ({ 
      default: mod.ReactQueryDevtools
    })),
    { 
      ssr: false,
      loading: () => null 
    }
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  // Create QueryClient instance per provider to avoid hydration issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // PERFORMANCE: Disable refetch on focus
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <ColorContrastProvider>
          <AriaProvider>
            <FocusManagerProvider>
              <LiveRegionProvider>
                {children}
              </LiveRegionProvider>
            </FocusManagerProvider>
          </AriaProvider>
        </ColorContrastProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ClerkProvider>
  );
}
