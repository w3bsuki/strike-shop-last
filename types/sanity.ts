/**
 * Sanity CMS Type Definitions
 * Types for content management system
 */

export interface SanityImageAsset {
  _id: string;
  url: string;
  metadata?: {
    dimensions?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    palette?: {
      dominant?: {
        background: string;
        foreground: string;
        title?: string;
      };
    };
  };
}

export interface SanityImage {
  _type: 'image';
  asset: SanityImageAsset | { _ref: string; _type: 'reference' };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  alt?: string;
  caption?: string;
}

export interface SanityReference {
  _ref: string;
  _type: 'reference';
}

export interface SanitySlug {
  _type: 'slug';
  current: string;
}

export interface SanityBlock {
  _type: 'block';
  _key: string;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote';
  listItem?: 'bullet' | 'number';
  markDefs?: Array<{
    _key: string;
    _type: string;
    [key: string]: unknown;
  }>;
  children: Array<{
    _type: 'span';
    _key: string;
    text: string;
    marks?: string[];
  }>;
}

export interface SanityCategory {
  _id: string;
  _type: 'category';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name: string;
  slug: SanitySlug;
  description?: string;
  image?: SanityImage;
  parent?: SanityReference | SanityCategory;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface SanityProduct {
  _id: string;
  _type: 'product';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name: string;
  slug: SanitySlug;
  sku?: string;
  description?: string;
  details?: SanityBlock[];
  images?: SanityImage[];
  categories?: Array<SanityReference | SanityCategory>;
  tags?: string[];
  brand?: string;
  material?: string;
  care?: string[];
  features?: string[];
  variants?: SanityProductVariant[];
  relatedProducts?: Array<SanityReference | SanityProduct>;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  // Content-specific fields
  story?: SanityBlock[];
  sizeGuide?: {
    measurements?: Array<{
      size: string;
      chest?: number;
      waist?: number;
      hips?: number;
      length?: number;
    }>;
    notes?: string;
  };
  sustainability?: {
    materials?: string[];
    certifications?: string[];
    description?: string;
  };
  // Pricing fields
  price?: number;
  compareAtPrice?: number;
  inStock?: boolean;
  // SEO fields
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface SanityProductVariant {
  _key: string;
  name: string;
  sku?: string;
  color?: {
    name: string;
    hex?: string;
  };
  size?: string;
  images?: SanityImage[];
  material?: string;
  stock?: number;
  price?: number;
  salePrice?: number;
}

export interface SanityHeroBanner {
  _id: string;
  _type: 'heroBanner';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title: string;
  subtitle?: string;
  image: SanityImage;
  mobileImage?: SanityImage;
  link?: {
    text: string;
    url: string;
  };
  overlay?: boolean;
  overlayColor?: string;
  textColor?: string;
  active?: boolean;
  order?: number;
}

export interface SanityCollection {
  _id: string;
  _type: 'collection';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name: string;
  slug: SanitySlug;
  description?: string;
  image?: SanityImage;
  products?: Array<SanityReference | SanityProduct>;
  featured?: boolean;
  order?: number;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface SanityPage {
  _id: string;
  _type: 'page';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title: string;
  slug: SanitySlug;
  content?: SanityBlock[];
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface SanityBlogPost {
  _id: string;
  _type: 'blogPost';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title: string;
  slug: SanitySlug;
  author?: {
    name: string;
    image?: SanityImage;
    bio?: string;
  };
  categories?: Array<SanityReference | SanityCategory>;
  tags?: string[];
  excerpt?: string;
  content?: SanityBlock[];
  mainImage?: SanityImage;
  publishedAt?: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface SanityHomePage {
  _id: string;
  _type: 'homePage';
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  hero?: {
    title?: string;
    subtitle?: string;
    images?: SanityImage[];
    cta?: {
      text: string;
      link: string;
    };
  };
  featuredCategories?: Array<SanityReference | SanityCategory>;
  featuredProducts?: Array<SanityReference | SanityProduct>;
  collections?: Array<SanityReference | SanityCollection>;
  content?: Array<{
    _key: string;
    _type: string;
    [key: string]: unknown;
  }>;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

// Query result types
export interface SanityProductQueryResult extends SanityProduct {
  categories?: SanityCategory[];
  relatedProducts?: SanityProduct[];
}

export interface SanityCategoryQueryResult extends SanityCategory {
  parent?: SanityCategory;
  products?: SanityProduct[];
}

export interface SanityCollectionQueryResult extends SanityCollection {
  products?: SanityProduct[];
}

// Utility types
export type SanityDocument =
  | SanityProduct
  | SanityCategory
  | SanityCollection
  | SanityHeroBanner
  | SanityPage
  | SanityBlogPost
  | SanityHomePage;
