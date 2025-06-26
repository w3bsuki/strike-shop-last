// Product component type definitions

export interface BaseProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  soldOut?: boolean;
  slug: string;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  prices?: any[];
}

export type ProductLayoutType = "scroll" | "grid" | "list";

export type ProductBadgeVariant = "sale" | "new" | "soldOut" | "limited" | "exclusive";

export type ProductSectionSpacing = "none" | "sm" | "default" | "lg";

export type ProductSectionBackground = "none" | "subtle" | "contrast" | "gradient";

export type ProductActionLayout = "horizontal" | "vertical" | "overlay";

export type ProductGridCols = 2 | 3 | 4 | 5 | 6;

export interface ProductShowcaseConfig {
  title: string;
  viewAllLink: string;
  layout: ProductLayoutType;
  showBadge?: boolean;
  badgeText?: string;
  badgeVariant?: ProductBadgeVariant;
  description?: string;
}

export interface ProductDisplaySettings {
  cardSizes: {
    scroll: {
      default: string;
      sm: string;
      lg: string;
    };
    grid: {
      default: string;
    };
  };
  priceDisplay: {
    showCurrency: boolean;
    currency: string;
    showOriginalPrice: boolean;
  };
  quickView: {
    enabled: boolean;
    showOnHover: boolean;
  };
  wishlist: {
    enabled: boolean;
    showOnCard: boolean;
  };
}