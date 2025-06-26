export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  count?: number;
  description?: string;
  featured?: boolean;
}

export interface CategoryConfig {
  title?: string;
  viewAllText?: string;
  viewAllHref?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const defaultCategoryConfig: CategoryConfig = {
  title: "Shop by Category",
  viewAllText: "View All",
  viewAllHref: "/categories",
  columns: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  },
};

export const categoryAspectRatios = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  golden: "aspect-[1.618/1]",
} as const;

export type CategoryAspectRatio = keyof typeof categoryAspectRatios;