'use client';

import { ClientProviders, AccessibilityProviders } from './providers-client';
import { ServerProviders } from './providers-server';

// Optimized provider structure that minimizes client boundary
export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ServerProviders>
      <ClientProviders>
        <AccessibilityProviders>
          {children}
        </AccessibilityProviders>
      </ClientProviders>
    </ServerProviders>
  );
}