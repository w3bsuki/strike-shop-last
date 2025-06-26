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
import { LiveRegionProvider } from '@/components/accessibility/live-region';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';

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
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true, // Allow zooming for accessibility
  viewportFit: 'cover', // Enable safe area support for notched devices
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = generateOrganizationJsonLd();
  const websiteJsonLd = generateWebsiteJsonLd();

  return (
    <html lang="en" className="font-typewriter">
      <head>
        {/* CRITICAL: Optimized viewport for perfect mobile performance */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, viewport-fit=cover, minimum-scale=1, maximum-scale=5" 
        />
        
        {/* ACCESSIBILITY: Theme and color scheme support */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        
        {/* PERFORMANCE: Preload critical assets */}
        <link rel="preload" href="/fonts/CourierPrime-Regular.ttf" as="font" type="font/ttf" crossOrigin="" />
        <link rel="preload" href="/fonts/CourierPrime-Bold.ttf" as="font" type="font/ttf" crossOrigin="" />
        
        {/* CRITICAL: DNS prefetch and preconnect for external domains */}
        <link rel="dns-prefetch" href="//cdn.sanity.io" />
        <link rel="dns-prefetch" href="//medusa-public-images.s3.eu-west-1.amazonaws.com" />
        <link rel="dns-prefetch" href="//clerk.com" />
        <link rel="dns-prefetch" href="//stripe.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
        <link rel="preconnect" href="https://medusa-public-images.s3.eu-west-1.amazonaws.com" crossOrigin="" />
        <link rel="preconnect" href="https://clerk.com" crossOrigin="" />
        <link rel="preconnect" href="https://stripe.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        
        {/* PERFORMANCE: Prefetch critical API endpoints */}
        <link rel="prefetch" href="/api/products" />
        <link rel="prefetch" href="/api/categories" />
        
        {/* PERFORMANCE: Resource hints for faster font loading */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
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
      <body className="font-typewriter">
        <SkipLink />
        <ProvidersWrapper>
          <LiveRegionProvider>
            {children}
            <ServiceWorkerRegistration />
          </LiveRegionProvider>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
