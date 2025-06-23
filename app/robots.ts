import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://strike-shop.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/studio/',
          '/_next/',
          '/checkout/',
          '/account/',
          '/*.json$',
          '/*?*utm_*', // Block tracking parameters
          '/*?*fbclid*', // Block Facebook click IDs
          '/*?*gclid*', // Block Google click IDs
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/studio/',
          '/_next/',
          '/checkout/',
          '/account/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/studio/',
          '/_next/',
          '/checkout/',
          '/account/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}