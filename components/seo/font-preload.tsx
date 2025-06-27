/**
 * Font Preload Component for Strike Shop
 * Optimizes font loading by preloading critical web fonts
 */

export function FontPreload() {
  return (
    <>
      {/* Preload TTF fonts that are actually used */}
      <link
        rel="preload"
        href="/fonts/CourierPrime-Regular.ttf"
        as="font"
        type="font/ttf"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/CourierPrime-Bold.ttf"
        as="font"
        type="font/ttf"
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