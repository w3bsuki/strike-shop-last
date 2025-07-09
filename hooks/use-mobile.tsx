'use client';

import { useState, useEffect } from 'react';

export function useMobile(query = '(max-width: 768px)') {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    const handleResize = () => setIsMobile(mediaQuery.matches);

    handleResize(); // Set initial state
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [query]);

  // Return undefined during SSR to prevent hydration mismatches
  if (!isClient) return undefined;
  
  return isMobile ?? false;
}
