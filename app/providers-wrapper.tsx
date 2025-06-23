'use client';

import { Providers } from '@/components/providers';

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}