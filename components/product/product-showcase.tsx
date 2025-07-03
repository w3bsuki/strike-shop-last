"use client";

import * as React from "react";
import { ProductSection } from "./product-section";
import { ProductHeader } from "./product-header";
import { ProductScroll } from "./product-scroll";
import { ProductGrid } from "./product-grid";
import { ProductCard } from "./product-card";
import { ProductBadge } from "./product-badge";

type Product = {
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
  variants?: Array<{
    id: string;
    title: string;
    sku?: string;
    prices?: any[];
  }>;
};

interface ProductShowcaseProps {
  title: string;
  description?: string;
  products: Product[];
  viewAllLink?: string;
  viewAllText?: string;
  layout?: "scroll" | "grid";
  gridCols?: 2 | 3 | 4 | 5 | 6;
  showBadge?: boolean;
  badgeText?: string;
  badgeVariant?: "sale" | "new" | "soldOut" | "limited" | "exclusive";
  sectionSpacing?: "none" | "sm" | "default" | "lg";
  sectionBackground?: "none" | "subtle" | "contrast" | "gradient";
  className?: string;
  headerAlign?: "left" | "center" | "right";
  priority?: boolean;
}

export function ProductShowcase({
  title,
  description,
  products,
  viewAllLink,
  viewAllText = "VIEW ALL",
  layout = "scroll",
  gridCols = 4,
  showBadge = false,
  badgeText,
  badgeVariant = "new",
  sectionSpacing = "default",
  sectionBackground = "none",
  className,
  headerAlign = "left",
  priority = false,
}: ProductShowcaseProps) {
  console.log('[ProductShowcase] Rendering:', title, 'with', products.length, 'products');
  console.log('[ProductShowcase] First product:', products[0]);
  const badge = showBadge && badgeText ? (
    <ProductBadge variant={badgeVariant} size="sm">
      {badgeText}
    </ProductBadge>
  ) : null;

  return (
    <ProductSection spacing={sectionSpacing} background={sectionBackground} className={className}>
      <ProductHeader
        title={title}
        {...(description && { description })}
        viewAllText={viewAllText}
        {...(viewAllLink && { viewAllHref: viewAllLink })}
        align={headerAlign}
        {...(badge && { badge })}
      />
      
      {layout === "scroll" ? (
        <ProductScroll showControls controlsPosition="outside">
          {products.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              className="flex-shrink-0 w-44 sm:w-48 md:w-52 lg:w-60 snap-start touch-manipulation"
              priority={priority && index < 4}
            />
          ))}
        </ProductScroll>
      ) : (
        <ProductGrid cols={gridCols}>
          {products.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              priority={priority && index < gridCols}
            />
          ))}
        </ProductGrid>
      )}
    </ProductSection>
  );
}