/**
 * Enhanced SEO utilities with comprehensive e-commerce schema markup
 */

import type { IntegratedProduct } from '@/types/integrated';

// Enhanced Product Schema with more e-commerce features
export function generateProductSchemaLd(product: IntegratedProduct, baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/product/${product.slug}#product`,
    name: product.content.name,
    description: product.content.description,
    brand: {
      '@type': 'Brand',
      '@id': `${baseUrl}#brand`,
      name: product.content.brand || 'STRIKE™',
      logo: `${baseUrl}/images/logo.png`,
    },
    category: product.content.categories?.[0]?.name || 'Streetwear',
    sku: product.sku,
    productID: product.id,
    
    // Images with proper schema
    image: product.content.images?.map((img, index) => ({
      '@type': 'ImageObject',
      '@id': `${baseUrl}/product/${product.slug}#image${index}`,
      url: typeof img === 'string' ? img : (img as any).asset?.url || '',
      width: 800,
      height: 1000,
      caption: `${product.content.name} - Image ${index + 1}`,
    })) || [],

    // Offers with variants
    offers: product.commerce.variants?.map((variant, index) => ({
      '@type': 'Offer',
      '@id': `${baseUrl}/product/${product.slug}#offer${index}`,
      url: `${baseUrl}/product/${product.slug}`,
      priceCurrency: 'GBP',
      price: variant.prices?.[0]?.amount || product.pricing?.basePrice || 0,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        '@id': `${baseUrl}#organization`,
        name: 'STRIKE™',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'GBP',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'GB',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
      // Variant-specific properties
      ...((variant as any).size && {
        size: (variant as any).size,
      }),
      ...((variant as any).color && {
        color: (variant as any).color,
      }),
    })) || [],

    // Aggregate Rating (you can replace with real data)
    aggregateRating: {
      '@type': 'AggregateRating',
      '@id': `${baseUrl}/product/${product.slug}#rating`,
      ratingValue: 4.5,
      reviewCount: 127,
      bestRating: 5,
      worstRating: 1,
    },

    // Sample reviews (replace with real data)
    review: [
      {
        '@type': 'Review',
        '@id': `${baseUrl}/product/${product.slug}#review1`,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
          bestRating: 5,
        },
        author: {
          '@type': 'Person',
          name: 'Alex M.',
        },
        reviewBody: 'Amazing quality and style. Perfect fit and great materials.',
        datePublished: '2024-01-15',
      },
    ],

    // Product features
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Material',
        value: product.content.material || '100% Premium Cotton',
      },
      {
        '@type': 'PropertyValue',
        name: 'Care Instructions',
        value: 'Machine wash cold, tumble dry low',
      },
      {
        '@type': 'PropertyValue',
        name: 'Country of Origin',
        value: 'United Kingdom',
      },
    ],

    // Breadcrumb integration
    isRelatedTo: {
      '@type': 'ProductGroup',
      '@id': `${baseUrl}/category/${product.content.categories?.[0]?.slug || 'all'}#productgroup`,
      name: product.content.categories?.[0]?.name || 'All Products',
    },
  };

  return JSON.stringify(schema, null, 2);
}

// BreadcrumbList Schema
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${baseUrl}#breadcrumb`,
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.url,
        url: item.url,
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}

// Collection/Category Schema
export function generateCollectionSchema(
  categoryName: string,
  products: IntegratedProduct[],
  baseUrl: string,
  categorySlug: string
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${baseUrl}/category/${categorySlug}#collection`,
    name: `${categoryName} - STRIKE™`,
    description: `Shop our ${categoryName} collection featuring premium streetwear and luxury fashion.`,
    url: `${baseUrl}/category/${categorySlug}`,
    
    // Main entity collection
    mainEntity: {
      '@type': 'ItemList',
      '@id': `${baseUrl}/category/${categorySlug}#itemlist`,
      name: `${categoryName} Products`,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          '@id': `${baseUrl}/product/${product.slug}#product`,
          name: product.content.name,
          image: product.content.images?.[0] 
            ? typeof product.content.images[0] === 'string' 
              ? product.content.images[0] 
              : (product.content.images[0] as any).asset?.url || ''
            : '',
          offers: {
            '@type': 'Offer',
            price: product.pricing?.basePrice || 0,
            priceCurrency: 'GBP',
            availability: product.commerce?.inventory?.available 
              ? 'https://schema.org/InStock' 
              : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },

    // Breadcrumb
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: {
            '@type': 'WebPage',
            '@id': baseUrl,
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryName,
          item: {
            '@type': 'WebPage',
            '@id': `${baseUrl}/category/${categorySlug}`,
          },
        },
      ],
    },
  };

  return JSON.stringify(schema, null, 2);
}

// Organization Schema with Store Information
export function generateEnhancedOrganizationSchema(baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'STRIKE™',
    alternateName: 'Strike Brand',
    description: 'Premium streetwear brand combining contemporary design with uncompromising quality.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${baseUrl}#logo`,
      url: `${baseUrl}/images/logo.png`,
      width: 200,
      height: 60,
    },
    image: {
      '@type': 'ImageObject',
      url: `${baseUrl}/images/hero-image.png`,
      width: 1200,
      height: 630,
    },
    
    // Contact Information
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+44-20-1234-5678',
        contactType: 'customer service',
        areaServed: ['GB', 'EU'],
        availableLanguage: ['English'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '17:00',
          validFrom: '2024-01-01',
          validThrough: '2024-12-31',
        },
      },
    ],

    // Social Media Profiles
    sameAs: [
      'https://www.facebook.com/strikebrand',
      'https://www.instagram.com/strikebrand',
      'https://twitter.com/strike_brand',
      'https://www.youtube.com/strikebrand',
      'https://www.linkedin.com/company/strikebrand',
    ],

    // Business Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Fashion Street',
      addressLocality: 'London',
      postalCode: 'SW1A 1AA',
      addressCountry: 'GB',
    },

    // Store Information
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'STRIKE™ Product Catalog',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: "Men's Streetwear",
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                category: 'Clothing',
                name: "Men's Collection",
              },
            },
          ],
        },
        {
          '@type': 'OfferCatalog',
          name: "Women's Streetwear",
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                category: 'Clothing',
                name: "Women's Collection",
              },
            },
          ],
        },
      ],
    },

    // Awards and recognition (customize as needed)
    award: [
      'Best Streetwear Brand 2024',
      'Sustainable Fashion Award 2023',
    ],

    // Founded date
    foundingDate: '2020-01-01',
    
    // Tax ID (VAT number for UK)
    taxID: 'GB123456789',
    
    // DUNS number (if applicable)
    duns: '123456789',
  };

  return JSON.stringify(schema, null, 2);
}

// FAQ Schema for product pages
export function generateFAQSchema(baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${baseUrl}#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is your return policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer a 30-day return policy for all unworn items with original tags. Items must be in original condition for a full refund.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does shipping take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Standard UK delivery takes 1-3 business days. Express delivery is available for next-day delivery when ordered before 2 PM.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you ship internationally?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we ship to EU countries and selected international destinations. Shipping costs and times vary by location.',
        },
      },
      {
        '@type': 'Question',
        name: 'How should I care for my STRIKE™ products?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Machine wash cold with like colors, tumble dry low, and iron inside out to preserve the quality and longevity of your garments.',
        },
      },
      {
        '@type': 'Question',
        name: 'What sizes do you offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer sizes XS to XXL for most items. Please refer to our size guide for specific measurements and fit information.',
        },
      },
    ],
  };

  return JSON.stringify(schema, null, 2);
}

// Website Schema with Search Action
export function generateWebsiteSchema(baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    name: 'STRIKE™',
    description: 'Premium streetwear brand combining contemporary design with uncompromising quality.',
    url: baseUrl,
    
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
    },
    
    // Copyright information
    copyrightYear: 2024,
    copyrightHolder: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
    },
    
    // License information
    license: `${baseUrl}/terms-and-conditions`,
    
    // Privacy policy
    privacyPolicy: `${baseUrl}/privacy-policy`,
    
    // Terms of service
    termsOfService: `${baseUrl}/terms-and-conditions`,
  };

  return JSON.stringify(schema, null, 2);
}

// Generate comprehensive meta tags for better SEO
export function generateMetaTags(
  title: string,
  description: string,
  url: string,
  imageUrl?: string,
  type: 'website' | 'product' | 'article' = 'website',
  price?: string,
  availability?: string
): Record<string, string> {
  const meta: Record<string, string> = {
    // Basic meta tags
    'title': title,
    'description': description,
    'robots': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    'googlebot': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    'bingbot': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    
    // Open Graph meta tags
    'og:title': title,
    'og:description': description,
    'og:type': type === 'product' ? 'product' : 'website',
    'og:url': url,
    'og:site_name': 'STRIKE™',
    'og:locale': 'en_GB',
    
    // Twitter meta tags
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:site': '@strike_brand',
    'twitter:creator': '@strike_brand',
    
    // Additional SEO meta tags
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black',
    'format-detection': 'telephone=no',
    
    // Canonical URL
    'canonical': url,
  };

  // Add image if provided
  if (imageUrl) {
    meta['og:image'] = imageUrl;
    meta['og:image:width'] = '1200';
    meta['og:image:height'] = '630';
    meta['og:image:alt'] = title;
    meta['twitter:image'] = imageUrl;
    meta['twitter:image:alt'] = title;
  }

  // Add product-specific meta tags
  if (type === 'product') {
    if (price) {
      meta['product:price:amount'] = price;
      meta['product:price:currency'] = 'GBP';
    }
    if (availability) {
      meta['product:availability'] = availability;
    }
    meta['product:brand'] = 'STRIKE™';
    meta['product:condition'] = 'new';
  }

  return meta;
}