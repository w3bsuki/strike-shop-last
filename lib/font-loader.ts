/**
 * Font Loading Optimization for Strike Shop
 * Implements progressive font loading with FOUT prevention
 */

export class FontLoader {
  private static instance: FontLoader;
  private fontsLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): FontLoader {
    if (!FontLoader.instance) {
      FontLoader.instance = new FontLoader();
    }
    return FontLoader.instance;
  }

  /**
   * Load fonts with optimal strategy
   */
  async loadFonts(): Promise<void> {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Return immediately if already loaded
    if (this.fontsLoaded) {
      return Promise.resolve();
    }

    this.loadPromise = this.performFontLoading();
    return this.loadPromise;
  }

  private async performFontLoading(): Promise<void> {
    try {
      // Add loading class for CSS hooks
      document.documentElement.classList.add('fonts-loading');

      // Define fonts to load
      const fonts = [
        {
          family: 'Typewriter',
          weight: 'normal',
          style: 'normal',
          url: '/fonts/optimized/CourierPrime-Regular.woff2'
        },
        {
          family: 'Typewriter',
          weight: 'bold',
          style: 'normal',
          url: '/fonts/optimized/CourierPrime-Bold.woff2'
        }
      ];

      // Use Font Loading API if available
      if ('fonts' in document) {
        const fontPromises = fonts.map(async (font) => {
          const fontFace = new FontFace(
            font.family,
            `url(${font.url}) format('woff2')`,
            {
              weight: font.weight,
              style: font.style,
              display: 'swap'
            }
          );

          // Add to document
          document.fonts.add(fontFace);

          // Load the font
          return fontFace.load();
        });

        // Wait for all fonts to load
        await Promise.all(fontPromises);

        // Check if fonts are actually available
        const regularLoaded = await document.fonts.check('12px Typewriter');
        const boldLoaded = await document.fonts.check('bold 12px Typewriter');

        if (regularLoaded || boldLoaded) {
          this.onFontsLoaded();
        }
      } else {
        // Fallback for browsers without Font Loading API
        // Create hidden elements to trigger font loading
        const testElements = fonts.map(font => {
          const el = document.createElement('span');
          el.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            visibility: hidden;
            font-family: Typewriter;
            font-weight: ${font.weight};
            font-size: 100px;
          `;
          el.textContent = 'BESbswy'; // Characters with distinct widths
          document.body.appendChild(el);
          return el;
        });

        // Use a simple timeout fallback
        setTimeout(() => {
          testElements.forEach(el => el.remove());
          this.onFontsLoaded();
        }, 1000);
      }
    } catch (error) {
      console.warn('Font loading failed:', error);
      // Still mark as loaded to prevent blocking
      this.onFontsLoaded();
    }
  }

  private onFontsLoaded(): void {
    this.fontsLoaded = true;
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('fontsloaded'));
    
    // Store in session storage to optimize subsequent loads
    try {
      sessionStorage.setItem('fonts-loaded', 'true');
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Check if fonts are already loaded (from previous page load)
   */
  checkCachedFonts(): boolean {
    try {
      return sessionStorage.getItem('fonts-loaded') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Preload fonts for critical text
   */
  preloadCriticalFonts(): void {
    // Create preload links if they don't exist
    const fonts = [
      '/fonts/optimized/CourierPrime-Regular.woff2',
      '/fonts/optimized/CourierPrime-Bold.woff2'
    ];

    fonts.forEach(fontUrl => {
      const existingPreload = document.querySelector(`link[href="${fontUrl}"]`);
      if (!existingPreload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.href = fontUrl;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }
}

// Export singleton instance
export const fontLoader = FontLoader.getInstance();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  // Check if fonts were loaded in previous navigation
  if (fontLoader.checkCachedFonts()) {
    document.documentElement.classList.add('fonts-loaded');
  } else {
    // Start loading fonts after initial render
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        fontLoader.loadFonts();
      });
    } else {
      // DOM already loaded
      requestAnimationFrame(() => {
        fontLoader.loadFonts();
      });
    }
  }
}