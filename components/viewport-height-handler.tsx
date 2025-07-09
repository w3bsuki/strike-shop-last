'use client';

import { useEffect } from 'react';
import { initViewportHeight } from '@/lib/viewport-height';

export function ViewportHeightHandler() {
  useEffect(() => {
    initViewportHeight();
  }, []);

  return null;
}