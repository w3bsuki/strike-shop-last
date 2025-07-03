'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { metrics, errorTracker, trackPageView } from '@/lib/monitoring';

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    // Setup error tracking
    errorTracker.setupGlobalHandlers();

    // Flush metrics on page unload
    const handleUnload = () => {
      metrics.flush();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return <>{children}</>;
}