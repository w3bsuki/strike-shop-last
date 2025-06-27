/**
 * Font Preload Component for Strike Shop
 * Optimizes font loading by preloading critical web fonts
 */

export function FontPreload() {
  return (
    <>
      {/* Preload optimized WOFF2 fonts for best performance */}
      <link
        rel="preload"
        href="/fonts/optimized/CourierPrime-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/optimized/CourierPrime-Bold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* DNS prefetch for external font services if needed */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      
      {/* Preconnect for faster font loading from CDN if used */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
    </>
  );
}