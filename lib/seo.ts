import type { Metadata } from 'next';
import type { IntegratedProduct } from '@/types/integrated';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  category?: string;
  sku?: string;
  gtin?: string;
}

export function generateMetadata(seoData: SEOData): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/images/hero-image.png',
    url = '',
    type = 'website',
    price,
    currency = 'GBP',
    availability = 'in stock',
    brand = 'STRIKE™',
    category,
    sku,
    gtin,
  } = seoData;

  const metadata: Metadata = {
    title: `${title} | STRIKE™`,
    description,
    keywords: keywords.join(', '),

    // Open Graph
    openGraph: {
      title: `${title} | STRIKE™`,
      description,
      url,
      type: type === 'product' ? 'website' : (type as 'article' | 'website'),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: 'STRIKE™',
      locale: 'en_GB',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: `${title} | STRIKE™`,
      description,
      images: [image],
      site: '@strike_brand',
      creator: '@strike_brand',
    },

    // Canonical URL
    alternates: {
      canonical: url,
    },

    // Additional meta tags
    other: {
      'theme-color': '#000000',
      'msapplication-TileColor': '#000000',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black',
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add product-specific meta tags
  if (type === 'product' && price) {
    const productMeta: Record<string, string> = {
      'product:price:amount': price,
      'product:price:currency': currency,
      'product:availability': availability,
    };

    if (brand) productMeta['product:brand'] = brand;

    metadata.other = {
      ...metadata.other,
      ...productMeta,
    };

    if (category) {
      metadata.other['product:category'] = category;
    }

    if (sku) {
      metadata.other['product:retailer_item_id'] = sku;
    }

    if (gtin) {
      metadata.other['product:gtin'] = gtin;
    }
  }

  return metadata;
}

export function generateStructuredData(seoData: SEOData) {
  const {
    title,
    description,
    image,
    url,
    type,
    price,
    currency = 'GBP',
    availability = 'in stock',
    brand = 'STRIKE™',
    category,
    sku,
    gtin,
  } = seoData;

  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'product' ? 'Product' : 'WebPage',
    name: title,
    description,
    image,
    url,
  };

  if (type === 'product') {
    return {
      ...baseStructuredData,
      '@type': 'Product',
      brand: {
        '@type': 'Brand',
        name: brand,
      },
      category,
      sku,
      gtin,
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: currency,
        availability: `https://schema.org/${availability === 'in stock' ? 'InStock' : availability === 'out of stock' ? 'OutOfStock' : 'PreOrder'}`,
        seller: {
          '@type': 'Organization',
          name: brand,
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        reviewCount: '100',
      },
    };
  }

  if (type === 'website') {
    return {
      ...baseStructuredData,
      '@type': 'WebSite',
      publisher: {
        '@type': 'Organization',
        name: brand,
        logo: {
          '@type': 'ImageObject',
          url: '/placeholder-logo.svg',
        },
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  return baseStructuredData;
}

export const defaultSEO: SEOData = {
  title: 'Luxury Streetwear Brand',
  description:
    "Discover STRIKE™ - Premium streetwear combining contemporary design with uncompromising quality. Shop the latest collections of men's, women's, and kids' fashion.",
  keywords: [
    'streetwear',
    'luxury fashion',
    'contemporary design',
    'premium clothing',
    "men's fashion",
    "women's fashion",
    'kids fashion',
    'urban wear',
    'designer clothing',
    'fashion brand',
  ],
  type: 'website',
  brand: 'STRIKE™',
};

// Category-specific SEO data
export const categorySEO = {
  men: {
    title: "Men's Streetwear Collection",
    description:
      "Explore STRIKE™'s men's collection featuring premium streetwear, contemporary designs, and luxury urban fashion for the modern man.",
    keywords: [
      "men's streetwear",
      "men's fashion",
      'urban wear',
      'contemporary menswear',
      'designer clothing men',
    ],
    category: "Men's Clothing",
  },
  women: {
    title: "Women's Streetwear Collection",
    description:
      "Discover STRIKE™'s women's collection with cutting-edge streetwear designs, premium materials, and contemporary style for the fashion-forward woman.",
    keywords: [
      "women's streetwear",
      "women's fashion",
      'urban wear',
      'contemporary womenswear',
      'designer clothing women',
    ],
    category: "Women's Clothing",
  },
  kids: {
    title: "Kids' Streetwear Collection",
    description:
      "Shop STRIKE™'s kids collection featuring stylish streetwear and contemporary designs for children who love fashion and comfort.",
    keywords: [
      'kids streetwear',
      "children's fashion",
      'kids urban wear',
      'contemporary kids clothing',
      'designer kids clothes',
    ],
    category: "Children's Clothing",
  },
  sale: {
    title: 'Sale - Discounted Streetwear',
    description:
      'Get the best deals on STRIKE™ premium streetwear. Shop discounted luxury fashion and contemporary designs at unbeatable prices.',
    keywords: [
      'streetwear sale',
      'discounted fashion',
      'luxury fashion deals',
      'designer clothing sale',
      'urban wear discounts',
    ],
    category: 'Sale Items',
  },
  new: {
    title: 'New Arrivals - Latest Streetwear',
    description:
      'Discover the latest STRIKE™ arrivals featuring cutting-edge streetwear designs, contemporary fashion, and premium urban wear.',
    keywords: [
      'new arrivals',
      'latest streetwear',
      'new fashion',
      'contemporary designs',
      'latest urban wear',
    ],
    category: 'New Arrivals',
  },
};

// Product-specific metadata generation
export function generateProductMetadata(
  product: IntegratedProduct,
  url: string
): Metadata {
  const productData: SEOData = {
    title: product.metadata?.title || product.content.name,
    description: product.metadata?.description || product.content.description || '',
    keywords: product.metadata?.keywords || product.content.tags || [],
    image: product.content.images?.[0]?.url || '/images/placeholder.jpg',
    url,
    type: 'product',
    price: product.pricing.basePrice.toString(),
    currency: 'GBP',
    availability: product.commerce.inventory.available ? 'in stock' : 'out of stock',
    brand: product.content.brand || 'STRIKE™',
    category: product.content.categories?.[0]?.name || undefined,
    sku: product.commerce.variants?.[0]?.sku || product.sku,
  };

  return generateMetadata(productData);
}

// Category-specific metadata generation
export function generateCategoryMetadata(
  category: string,
  url: string
): Metadata {
  const categoryData = categorySEO[category as keyof typeof categorySEO] || {
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Collection`,
    description: `Shop our ${category} collection at STRIKE™. Premium streetwear and luxury fashion.`,
    keywords: [category, 'streetwear', 'fashion', 'STRIKE'],
    category: category,
  };

  const seoData: SEOData = {
    ...categoryData,
    url,
    type: 'website',
    image: '/images/category-placeholder.jpg',
  };

  return generateMetadata(seoData);
}

// Generate Product JSON-LD structured data
export function generateProductJsonLd(
  product: IntegratedProduct,
  url: string
): string {
  const structuredData = generateStructuredData({
    title: product.content.name,
    description: product.content.description || '',
    image: product.content.images?.[0]?.url,
    url,
    type: 'product',
    price: product.pricing.basePrice.toString(),
    currency: 'GBP',
    availability: product.commerce.inventory.available ? 'in stock' : 'out of stock',
    brand: product.content.brand || 'STRIKE™',
    category: product.content.categories?.[0]?.name,
    sku: product.commerce.variants?.[0]?.sku || product.sku,
  });

  return JSON.stringify(structuredData);
}

// Generate Organization JSON-LD structured data
export function generateOrganizationJsonLd(): string {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'STRIKE™',
    url: 'https://strike-shop.com',
    logo: 'https://strike-shop.com/placeholder-logo.svg',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+44-20-1234-5678',
      contactType: 'customer service',
      areaServed: 'GB',
      availableLanguage: 'English',
    },
    sameAs: [
      'https://www.facebook.com/strikebrand',
      'https://www.instagram.com/strikebrand',
      'https://twitter.com/strike_brand',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
      addressLocality: 'London',
    },
  };

  return JSON.stringify(organizationData);
}

// Generate Website JSON-LD structured data
export function generateWebsiteJsonLd(): string {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'STRIKE™',
    url: 'https://strike-shop.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://strike-shop.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'STRIKE™',
      logo: {
        '@type': 'ImageObject',
        url: 'https://strike-shop.com/placeholder-logo.svg',
      },
    },
  };

  return JSON.stringify(websiteData);
}
