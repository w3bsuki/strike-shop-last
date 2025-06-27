'use client';

import { useEffect } from 'react';

/**
 * Font Performance Monitor
 * Tracks and reports font loading performance metrics
 */
export function FontPerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Track font loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource' && entry.name.includes('/fonts/')) {
          const fontName = entry.name.split('/').pop();
          const loadTime = entry.responseEnd - entry.startTime;
          
          console.log(`Font Performance: ${fontName}`);
          console.log(`  Load time: ${loadTime.toFixed(2)}ms`);
          console.log(`  Size: ${(entry.transferSize / 1024).toFixed(2)}KB`);
          console.log(`  Cached: ${entry.transferSize === 0 ? 'Yes' : 'No'}`);
          
          // Send to analytics if needed
          if (window.gtag) {
            window.gtag('event', 'font_load', {
              font_name: fontName,
              load_time: loadTime,
              transfer_size: entry.transferSize,
              cached: entry.transferSize === 0
            });
          }
        }
      });
    });

    // Observe resource timing entries
    observer.observe({ entryTypes: ['resource'] });

    // Track font display timing
    if (document.fonts && document.fonts.ready) {
      const startTime = performance.now();
      
      document.fonts.ready.then(() => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        console.log(`All fonts loaded in: ${totalTime.toFixed(2)}ms`);
        
        // Check specific fonts
        const fonts = ['12px Typewriter', 'bold 12px Typewriter'];
        fonts.forEach(font => {
          const loaded = document.fonts.check(font);
          console.log(`Font "${font}" loaded: ${loaded}`);
        });
      });
    }

    // Monitor CLS caused by font loading
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // Report CLS after fonts load
      setTimeout(() => {
        console.log(`CLS during font loading: ${clsValue.toFixed(4)}`);
      }, 5000);
    } catch (e) {
      // Layout shift observer might not be supported
    }

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return null;
}

// Export performance metrics helper
export function getFontMetrics() {
  if (typeof window === 'undefined' || !performance.getEntriesByType) {
    return null;
  }

  const resources = performance.getEntriesByType('resource');
  const fontResources = resources.filter(r => r.name.includes('/fonts/'));
  
  return fontResources.map(font => ({
    name: font.name.split('/').pop(),
    loadTime: font.responseEnd - font.startTime,
    size: font.transferSize,
    cached: font.transferSize === 0,
    protocol: font.nextHopProtocol
  }));
}