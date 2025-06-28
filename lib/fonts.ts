import localFont from 'next/font/local';

// Configure Typewriter font with Next.js font optimization
export const typewriterFont = localFont({
  src: [
    {
      path: '../public/fonts/CourierPrime-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/CourierPrime-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-typewriter',
  display: 'swap',
  preload: true,
  fallback: ['Courier New', 'Courier', 'ui-monospace', 'monospace'],
});