import type { ProductId, CategoryId, ImageURL, Slug, SKU, VariantId, Price } from './branded';

export interface HomePageCategory {
  id: CategoryId;
  name: string;
  count: number;
  image: ImageURL;
  slug: Slug;
}

export interface HomePageProduct {
  id: ProductId;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: ImageURL;
  images?: ImageURL[];
  isNew?: boolean;
  soldOut?: boolean;
  slug: Slug;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: SKU;
  variants?: Array<{
    id: VariantId;
    title: string;
    sku?: SKU;
    prices?: Array<{
      amount: Price;
      currency_code: string;
    }>;
  }>;
}

export type HomePageProps = {
  categories: HomePageCategory[];
  newArrivals: HomePageProduct[];
  saleItems: HomePageProduct[];
  sneakers: HomePageProduct[];
  kidsItems: HomePageProduct[];
};
