/**
 * Sanity CMS Client Configuration
 * Production-ready Sanity integration with caching, CDN optimization,
 * and comprehensive content management
 */

import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { SanityClient } from '@sanity/client';

// Environment validation
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo-project';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-06-11';

// Only warn in development if Sanity credentials are missing
if ((!projectId || projectId === 'demo-project' || !dataset) && process.env.NODE_ENV === 'development') {

}

// Sanity client configuration
export const sanityClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production', // Use CDN in production
  perspective: 'published', // Only fetch published content
  stega: {
    enabled: process.env.NODE_ENV === 'development',
    studioUrl: '/studio',
  },
  requestTagPrefix: 'strike-shop',
  ignoreBrowserTokenWarning: true,
});

// Image URL builder
const builder = imageUrlBuilder(sanityClient);

// Image URL builder with optimization
export const urlForImage = (source: SanityImageSource) => {
  return builder.image(source).auto('format').fit('max');
};

// Image URL with specific dimensions and quality
export const urlForImageWithDimensions = (
  source: SanityImageSource,
  width: number,
  height?: number,
  quality: number = 80
) => {
  let urlBuilder = builder
    .image(source)
    .auto('format')
    .quality(quality)
    .width(width);

  if (height) {
    urlBuilder = urlBuilder.height(height).fit('crop').crop('center');
  }

  return urlBuilder;
};

// Responsive image URLs
export const getResponsiveImageUrls = (source: SanityImageSource) => {
  const baseBuilder = builder.image(source).auto('format');

  return {
    mobile: baseBuilder.width(480).quality(75).url(),
    tablet: baseBuilder.width(768).quality(80).url(),
    desktop: baseBuilder.width(1200).quality(85).url(),
    large: baseBuilder.width(1920).quality(90).url(),
  };
};

// Cache configuration
interface CacheConfig {
  defaultTTL: number;
  maxAge: number;
  staleWhileRevalidate: number;
}

const cacheConfig: CacheConfig = {
  defaultTTL: 300000, // 5 minutes
  maxAge: 86400000, // 24 hours
  staleWhileRevalidate: 3600000, // 1 hour
};

// In-memory cache for Sanity queries
class SanityCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
    new Map();

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  set<T>(key: string, data: T, ttl: number = cacheConfig.defaultTTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const cache = new SanityCache();

// GROQ query builder utilities
export const groqQueries = {
  // Home page content
  homePage: `
    *[_type == "page" && slug.current == "home"][0] {
      _id,
      title,
      slug,
      seo,
      hero {
        title,
        subtitle,
        backgroundImage,
        ctaText,
        ctaLink
      },
      sections[] {
        _type,
        _key,
        title,
        subtitle,
        content,
        image,
        products[]-> {
          _id,
          title,
          slug,
          price,
          images[] {
            asset-> {
              _id,
              url,
              metadata
            },
            alt
          },
          category-> {
            _id,
            title,
            slug
          }
        }
      }
    }
  `,

  // Product queries
  allProducts: `
    *[_type == "product"] | order(_createdAt desc) {
      _id,
      title,
      slug,
      description,
      price,
      compareAtPrice,
      sku,
      inStock,
      images[] {
        asset-> {
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        },
        alt
      },
      category-> {
        _id,
        title,
        slug
      },
      tags,
      seo,
      _createdAt,
      _updatedAt
    }
  `,

  productBySlug: (slug: string) => `
    *[_type == "product" && slug.current == "${slug}"][0] {
      _id,
      title,
      slug,
      description,
      price,
      compareAtPrice,
      sku,
      inStock,
      images[] {
        asset-> {
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        },
        alt
      },
      category-> {
        _id,
        title,
        slug,
        description
      },
      tags,
      seo,
      variants[] {
        _key,
        title,
        sku,
        price,
        inStock,
        options {
          color,
          size,
          material
        }
      },
      relatedProducts[]-> {
        _id,
        title,
        slug,
        price,
        images[0] {
          asset-> {
            _id,
            url
          },
          alt
        }
      },
      _createdAt,
      _updatedAt
    }
  `,

  // Category queries
  allCategories: `
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      slug,
      description,
      image {
        asset-> {
          _id,
          url,
          metadata
        },
        alt
      },
      parent-> {
        _id,
        title,
        slug
      },
      children[]-> {
        _id,
        title,
        slug
      },
      seo
    }
  `,

  categoryBySlug: (slug: string) => `
    *[_type == "category" && slug.current == "${slug}"][0] {
      _id,
      title,
      slug,
      description,
      image {
        asset-> {
          _id,
          url,
          metadata
        },
        alt
      },
      parent-> {
        _id,
        title,
        slug
      },
      children[]-> {
        _id,
        title,
        slug
      },
      seo,
      "products": *[_type == "product" && references(^._id)] {
        _id,
        title,
        slug,
        price,
        compareAtPrice,
        images[0] {
          asset-> {
            _id,
            url
          },
          alt
        },
        inStock
      }
    }
  `,

  // Site settings
  siteSettings: `
    *[_type == "siteSettings"][0] {
      _id,
      title,
      description,
      logo {
        asset-> {
          _id,
          url
        },
        alt
      },
      favicon {
        asset-> {
          _id,
          url
        }
      },
      socialMedia {
        instagram,
        twitter,
        facebook,
        tiktok
      },
      seo {
        metaTitle,
        metaDescription,
        ogImage {
          asset-> {
            _id,
            url
          }
        }
      },
      navigation[] {
        _key,
        title,
        link,
        children[] {
          _key,
          title,
          link
        }
      },
      footer {
        copyright,
        links[] {
          _key,
          title,
          links[] {
            _key,
            title,
            link
          }
        }
      }
    }
  `,

  // Community fits
  communityFits: `
    *[_type == "communityFit"] | order(_createdAt desc) {
      _id,
      title,
      description,
      image {
        asset-> {
          _id,
          url,
          metadata
        },
        alt
      },
      user {
        name,
        instagram,
        avatar {
          asset-> {
            _id,
            url
          }
        }
      },
      products[]-> {
        _id,
        title,
        slug,
        price
      },
      tags,
      likes,
      featured,
      _createdAt
    }
  `,
};

// High-level API service
export class SanityService {
  private static instance: SanityService;

  private constructor() {}

  static getInstance(): SanityService {
    if (!SanityService.instance) {
      SanityService.instance = new SanityService();
    }
    return SanityService.instance;
  }

  // Generic query method with caching
  async query<T>(
    query: string,
    params: Record<string, any> = {},
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<T> {
    const { cache: useCache = true, ttl = cacheConfig.defaultTTL } = options;
    const cacheKey = `${query}_${JSON.stringify(params)}`;

    if (useCache) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Executing Sanity query
      const result = await sanityClient.fetch<T>(query, params);

      if (useCache) {
        cache.set(cacheKey, result, ttl);
      }

      return result;
    } catch (error) {

      throw new Error(`Sanity query failed: ${error}`);
    }
  }

  // Home page content
  async getHomePage() {
    return this.query(groqQueries.homePage, {}, { ttl: 600000 }); // 10 minutes cache
  }

  // Product methods
  async getAllProducts() {
    return this.query(groqQueries.allProducts, {}, { ttl: 300000 }); // 5 minutes cache
  }

  async getProductBySlug(slug: string) {
    return this.query(groqQueries.productBySlug(slug), {}, { ttl: 600000 }); // 10 minutes cache
  }

  async getProductsByCategory(categoryId: string) {
    const query = `*[_type == "product" && references("${categoryId}")] {
      _id,
      title,
      slug,
      price,
      compareAtPrice,
      images[0] {
        asset-> {
          _id,
          url
        },
        alt
      },
      inStock
    }`;
    return this.query(query, {}, { ttl: 300000 });
  }

  // Category methods
  async getAllCategories() {
    return this.query(groqQueries.allCategories, {}, { ttl: 3600000 }); // 1 hour cache
  }

  async getCategoryBySlug(slug: string) {
    return this.query(groqQueries.categoryBySlug(slug), {}, { ttl: 600000 }); // 10 minutes cache
  }

  // Site settings
  async getSiteSettings() {
    return this.query(groqQueries.siteSettings, {}, { ttl: 3600000 }); // 1 hour cache
  }

  // Community fits
  async getCommunityFits(limit: number = 12) {
    const query = `${groqQueries.communityFits}[0...${limit}]`;
    return this.query(query, {}, { ttl: 300000 }); // 5 minutes cache
  }

  async getFeaturedCommunityFits(limit: number = 6) {
    const query = `*[_type == "communityFit" && featured == true] | order(_createdAt desc) [0...${limit}] {
      _id,
      title,
      description,
      image {
        asset-> {
          _id,
          url,
          metadata
        },
        alt
      },
      user {
        name,
        instagram
      },
      products[]-> {
        _id,
        title,
        slug,
        price
      },
      likes,
      _createdAt
    }`;
    return this.query(query, {}, { ttl: 600000 }); // 10 minutes cache
  }

  // Search
  async searchProducts(searchTerm: string, limit: number = 20) {
    const query = `*[_type == "product" && (
      title match "${searchTerm}*" ||
      description match "${searchTerm}*" ||
      "${searchTerm}" in tags
    )] | order(title asc) [0...${limit}] {
      _id,
      title,
      slug,
      price,
      compareAtPrice,
      images[0] {
        asset-> {
          _id,
          url
        },
        alt
      },
      category-> {
        _id,
        title,
        slug
      }
    }`;
    return this.query(query, {}, { cache: false }); // Don't cache search results
  }

  // Clear cache
  clearCache(): void {
    cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: cache.size(),
      config: cacheConfig,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await sanityClient.fetch('*[_type == "siteSettings"][0]._id');
      return true;
    } catch (error) {

      return false;
    }
  }
}

// Export singleton instance
export const sanityService = SanityService.getInstance();

// Helper functions
export const formatSanityDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const extractPlainText = (blocks: any[]): string => {
  if (!blocks || !Array.isArray(blocks)) return '';

  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => {
      if (block.children) {
        return block.children.map((child: any) => child.text).join('');
      }
      return '';
    })
    .join(' ');
};

export const generateSanityImageSrcSet = (
  source: SanityImageSource
): string => {
  const urls = getResponsiveImageUrls(source);
  return [
    `${urls.mobile} 480w`,
    `${urls.tablet} 768w`,
    `${urls.desktop} 1200w`,
    `${urls.large} 1920w`,
  ].join(', ');
};

// Error handling
export class SanityError extends Error {
  constructor(
    message: string,
    public query?: string,
    public params?: Record<string, any>
  ) {
    super(message);
    this.name = 'SanityError';
  }
}

// TypeScript interfaces
export interface SanityProduct {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  inStock: boolean;
  images: SanityImage[];
  category: SanityCategory;
  tags: string[];
  seo: SanitySEO;
  variants?: SanityProductVariant[];
  relatedProducts?: SanityProduct[];
  _createdAt: string;
  _updatedAt: string;
}

export interface SanityCategory {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  image: SanityImage;
  parent?: SanityCategory;
  children?: SanityCategory[];
  seo: SanitySEO;
  products?: SanityProduct[];
}

export interface SanityImage {
  asset: {
    _id: string;
    url: string;
    metadata?: {
      dimensions: {
        width: number;
        height: number;
      };
      lqip: string;
    };
  };
  alt: string;
}

export interface SanitySEO {
  metaTitle: string;
  metaDescription: string;
  ogImage?: SanityImage;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface SanityProductVariant {
  _key: string;
  title: string;
  sku: string;
  price: number;
  inStock: boolean;
  options: {
    color?: string;
    size?: string;
    material?: string;
  };
}

export interface SanityCommunityFit {
  _id: string;
  title: string;
  description: string;
  image: SanityImage;
  user: {
    name: string;
    instagram: string;
    avatar?: SanityImage;
  };
  products: SanityProduct[];
  tags: string[];
  likes: number;
  featured: boolean;
  _createdAt: string;
}

export interface SanitySiteSettings {
  _id: string;
  title: string;
  description: string;
  logo: SanityImage;
  favicon: SanityImage;
  socialMedia: {
    instagram: string;
    twitter: string;
    facebook: string;
    tiktok: string;
  };
  seo: SanitySEO;
  navigation: NavigationItem[];
  footer: {
    copyright: string;
    links: FooterSection[];
  };
}

export interface NavigationItem {
  _key: string;
  title: string;
  link: string;
  children?: NavigationItem[];
}

export interface FooterSection {
  _key: string;
  title: string;
  links: NavigationItem[];
}

// Performance monitoring
let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

setInterval(async () => {
  try {
    await sanityService.healthCheck();
    lastHealthCheck = Date.now();
  } catch (error) {

  }
}, HEALTH_CHECK_INTERVAL);

export const getSanityConnectionStatus = () => ({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  lastHealthCheck,
  cacheStats: sanityService.getCacheStats(),
});

// Export aliases for backward compatibility
// Components are importing 'client' and 'urlFor' but actual exports are 'sanityClient' and 'urlForImage'
export const client = sanityClient;
export const urlFor = urlForImage;
