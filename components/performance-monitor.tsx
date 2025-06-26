'use client';

import { useEffect } from 'react';
import { performanceMonitor } from '@/utils/performance-monitor';

export function PerformanceMonitor() {
  useEffect(() => {
    // Clean up on unmount
    return () => {
      performanceMonitor.cleanup();
    };
  }, []);

  // This component doesn't render anything, it just initializes monitoring
  return null;
}