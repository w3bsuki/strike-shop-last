/**
 * Sanity CMS type definitions stub
 * TODO: Replace with actual Sanity types when CMS is configured
 */

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  url: string;
  width: number;
  height: number;
}

export interface SanityBlock {
  _type: 'block';
  children: Array<{
    _type: 'span';
    text: string;
    marks?: string[];
  }>;
  style?: string;
  listItem?: string;
  level?: number;
}

export interface SanityCategory {
  _id: string;
  _type: 'category';
  name: string;
  handle: string;
  slug: {
    current: string;
  };
  description?: string;
  image?: SanityImage;
}

export interface SanityProduct {
  _id: string;
  _type: 'product';
  name: string;
  handle: string;
  slug: {
    current: string;
  };
  description?: string;
  images: SanityImage[];
  categories?: SanityCategory[];
  tags?: string[];
  brand?: string;
  material?: string;
  care?: string[];
  features?: string[];
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
}