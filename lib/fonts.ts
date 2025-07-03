import { Courier_Prime, Inter } from 'next/font/google';

// Use Google Fonts instead of local fonts to avoid loading issues
export const typewriterFont = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-typewriter',
  display: 'swap',
});

// Professional font for body text (similar to Off-White's clean aesthetic)
export const professionalFont = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-professional',
  display: 'swap',
});