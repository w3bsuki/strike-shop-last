import { Inter, Courier_Prime, IBM_Plex_Mono } from 'next/font/google';

// Primary font for headings, navigation, and body text
export const primaryFont = Inter({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-primary',
  display: 'swap',
});

// Typewriter font for product details, pricing, and special callouts
export const typewriterFont = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-typewriter',
  display: 'swap',
});

// Monospace font for product codes, technical specs
export const monoFont = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
});

// Legacy exports for backward compatibility
export const professionalFont = primaryFont;
export const headerFont = primaryFont;