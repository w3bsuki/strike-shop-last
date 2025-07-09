// Server-side providers that don't require client-side functionality
import type React from 'react';

// Server-compatible providers that work with RSC
export function ServerProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Add any server-compatible providers here */}
      {/* For example: theme providers that read from cookies, i18n providers, etc. */}
      {children}
    </>
  );
}