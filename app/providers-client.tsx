'use client';

import { SupabaseAuthProvider } from '@/lib/supabase/auth-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useState } from 'react';

// Critical accessibility providers that need client-side functionality
import { AriaProvider } from '@/components/accessibility/aria-helpers';
import { ColorContrastProvider } from '@/components/accessibility/color-contrast-system';
import { FocusManagerProvider } from '@/components/accessibility/enhanced-focus-manager';
import { LiveRegionProvider } from '@/components/accessibility/live-region';
import { CartProvider } from '@/components/providers/cart-provider';
import { CurrencyProvider } from '@/lib/currency/currency-context';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { RegionProvider } from '@/lib/region/region-context';

// Lazy load dev tools
let ReactQueryDevtools: any = () => null;

if (process.env.NODE_ENV === 'development') {
  ReactQueryDevtools = dynamic(
    () => import('@tanstack/react-query-devtools').then(mod => ({ 
      default: mod.ReactQueryDevtools
    })),
    { 
      
      loading: () => null 
    }
  );
}

// Minimal client providers - only what's absolutely necessary
export function ClientProviders({ children }: { children: React.ReactNode }) {
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

  return (
    <SupabaseAuthProvider>
      <QueryClientProvider client={queryClient}>
        <RegionProvider>
          <CurrencyProvider>
            <CartProvider>
              <QuickViewProvider>
                {children}
              </QuickViewProvider>
            </CartProvider>
          </CurrencyProvider>
        </RegionProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SupabaseAuthProvider>
  );
}

// Accessibility providers that require client-side functionality
export function AccessibilityProviders({ children }: { children: React.ReactNode }) {
  return (
    <ColorContrastProvider>
      <AriaProvider>
        <FocusManagerProvider>
          <LiveRegionProvider>
            {children}
          </LiveRegionProvider>
        </FocusManagerProvider>
      </AriaProvider>
    </ColorContrastProvider>
  );
}