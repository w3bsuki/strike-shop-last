import { useEffect, useState } from 'react';
import { fontLoader } from '@/lib/font-loader';

interface UseFontLoadingReturn {
  fontsLoaded: boolean;
  fontsLoading: boolean;
  error: Error | null;
}

/**
 * Hook to manage font loading state
 * Provides loading states and error handling for font loading
 */
export function useFontLoading(): UseFontLoadingReturn {
  const [fontsLoaded, setFontsLoaded] = useState(() => {
    // Check if fonts are already loaded from cache
    if (typeof window !== 'undefined') {
      return fontLoader.checkCachedFonts() || 
             document.documentElement.classList.contains('fonts-loaded');
    }
    return false;
  });
  
  const [fontsLoading, setFontsLoading] = useState(!fontsLoaded);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if already loaded
    if (fontsLoaded) {
      setFontsLoading(false);
      return;
    }

    let mounted = true;

    const loadFonts = async () => {
      try {
        setFontsLoading(true);
        await fontLoader.loadFonts();
        
        if (mounted) {
          setFontsLoaded(true);
          setFontsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Font loading failed'));
          setFontsLoading(false);
          // Still mark as loaded to prevent blocking
          setFontsLoaded(true);
        }
      }
    };

    // Listen for font loaded event
    const handleFontsLoaded = () => {
      if (mounted) {
        setFontsLoaded(true);
        setFontsLoading(false);
      }
    };

    window.addEventListener('fontsloaded', handleFontsLoaded);
    
    // Start loading
    loadFonts();

    return () => {
      mounted = false;
      window.removeEventListener('fontsloaded', handleFontsLoaded);
    };
  }, [fontsLoaded]);

  return { fontsLoaded, fontsLoading, error };
}

/**
 * Hook to preload critical fonts
 * Use this in your layout or critical pages
 */
export function usePreloadFonts() {
  useEffect(() => {
    fontLoader.preloadCriticalFonts();
  }, []);
}