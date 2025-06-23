import type { MetadataRoute } from 'next';
import { client } from '@/lib/sanity';
import { MedusaProductService } from '@/lib/medusa-service';

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
    // Try to get products from Medusa first
    const medusaProducts = await MedusaProductService.getProducts({
      limit: 1000,
    });

    if (medusaProducts && medusaProducts.products.length > 0) {
      productPages = medusaProducts.products.map((product) => ({
        url: `${baseUrl}/product/${product.handle}`,
        lastModified: new Date(product.updated_at || product.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } else {
      // Fallback to Sanity if Medusa has no products
      const sanityProducts = await client.fetch(`
        *[_type == "product"]{
          "slug": slug.current,
          _updatedAt
        }
      `);

      productPages = sanityProducts.map((product: { slug: string; _updatedAt: string }) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(product._updatedAt),
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
    // Try to get categories from Medusa first
    const medusaCategories = await MedusaProductService.getCategories();

    if (medusaCategories && medusaCategories.length > 0) {
      categoryPages = medusaCategories.map((category) => ({
        url: `${baseUrl}/${category.handle}`,
        lastModified: new Date(category.updated_at || category.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    } else {
      // Fallback to Sanity categories
      const sanityCategories = await client.fetch(`
        *[_type == "category"]{
          "slug": slug.current,
          _updatedAt
        }
      `);

      categoryPages = sanityCategories.map((category: { slug: string; _updatedAt: string }) => ({
        url: `${baseUrl}/${category.slug}`,
        lastModified: new Date(category._updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (_error) {
    // Error fetching data - continue without it
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
