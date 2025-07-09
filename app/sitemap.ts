import type { MetadataRoute } from 'next';
import { ShopifyService } from '@/lib/shopify/services';

// PERFORMANCE: Cache sitemap for 1 hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://strike-shop.com';

  // CRITICAL: Static pages with perfect SEO priorities
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/men`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/women`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kids`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sale`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/new`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hot`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/special`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    // SEO: Additional important pages
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Get dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];

  try {
    // Try to get products from Shopify
    const shopifyProducts = await ShopifyService.getProducts(1000);

    if (shopifyProducts && shopifyProducts.length > 0) {
      productPages = shopifyProducts.map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (_error) {
    // Error fetching data - continue without it
  }

  // Get category pages
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    // Try to get collections from Shopify
    const shopifyCollections = await ShopifyService.getCollections();

    if (shopifyCollections && shopifyCollections.length > 0) {
      categoryPages = shopifyCollections.map((collection) => ({
        url: `${baseUrl}/${collection.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (_error) {
    // Error fetching data - continue without it
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
