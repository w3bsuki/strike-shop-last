import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import {
  defaultSEO,
  generateOrganizationJsonLd,
  generateWebsiteJsonLd,
} from '@/lib/seo';
import { ProvidersWrapper } from './providers-wrapper';
import { SkipLink } from '@/components/accessibility/skip-link';
import { ServiceWorkerProvider } from '@/components/service-worker-provider';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { CartInitializer } from '@/components/cart-initializer';
import { primaryFont, typewriterFont, monoFont } from '@/lib/fonts';
import { CookieConsent } from '@/components/cookie-consent';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://strike-shop.com';

// PERFECT SEO: Comprehensive metadata for 100/100 SEO score
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${defaultSEO.title} | STRIKE™`,
    template: '%s | STRIKE™',
  },
  description: defaultSEO.description,
  keywords: defaultSEO.keywords,
  authors: [{ name: 'STRIKE™' }],
  creator: 'STRIKE™',
  publisher: 'STRIKE™',
  applicationName: 'STRIKE™',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: `${defaultSEO.title} | STRIKE™`,
    description: defaultSEO.description,
    url: baseUrl,
    siteName: 'STRIKE™',
    images: [
      {
        url: '/images/hero-image.png',
        width: 1200,
        height: 630,
        alt: 'STRIKE™ - Luxury Streetwear Brand',
        type: 'image/png'
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${defaultSEO.title} | STRIKE™`,
    description: defaultSEO.description,
    site: '@strike_brand',
    creator: '@strike_brand',
    images: ['/images/hero-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false, // Enable caching for better performance
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'en-GB': baseUrl,
      'en-US': baseUrl,
    },
  },
  category: 'ecommerce',
  classification: 'Fashion',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#000000' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0, // Allow zoom for accessibility
  userScalable: true, // Allow user scaling for accessibility
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const organizationJsonLd = generateOrganizationJsonLd();
  const websiteJsonLd = generateWebsiteJsonLd();

  return (
    <html lang="en" className={`${primaryFont.variable} ${typewriterFont.variable} ${monoFont.variable}`}>
      <head>
        {/* CRITICAL: Optimized viewport for perfect mobile performance - handled by Next.js viewport export */}
        
        {/* ACCESSIBILITY: Theme and color scheme support */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        
        {/* PWA Meta Tags - MOBILE OPTIMIZED */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Strike Shop" />
        <meta name="application-name" content="Strike Shop" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        
        {/* Splash Screens for iOS */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2688.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1080-1920.jpg" media="(device-width: 360px) and (device-height: 640px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640-1136.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        
        {/* PERFORMANCE: Preload critical fonts - Google Fonts handles optimization */}
        
        {/* CRITICAL: DNS prefetch and preconnect for external domains */}
        <link rel="dns-prefetch" href="//cdn.sanity.io" />
        <link rel="dns-prefetch" href="//cdn.shopify.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        
        {/* PERFORMANCE: Prefetch critical pages */}
        <link rel="prefetch" href="/men" />
        <link rel="prefetch" href="/women" />
        
        {/* PERFORMANCE: Resource hints for faster font loading */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* STRUCTURED DATA: Essential for SEO */}
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
          strategy="afterInteractive"
        />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
          strategy="afterInteractive"
        />
      </head>
      <body className={`${primaryFont.variable} ${typewriterFont.variable} ${monoFont.variable} font-primary`}>
        <SkipLink />
        <AppErrorBoundary>
          <ProvidersWrapper>
            {children}
            {modal}
            <CartInitializer />
            <ServiceWorkerProvider />
            <PWAInstallPrompt />
            <CookieConsent />
          </ProvidersWrapper>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
