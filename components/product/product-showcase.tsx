import * as React from "react";
import { ProductSection } from "./product-section";
import { ProductHeader } from "./product-header";
import { ProductScroll } from "./product-scroll";
import { ProductGrid } from "./product-grid";
import { ProductCard } from "./product-card";
import { ProductBadge } from "./product-badge";
import { SectionInfo } from "@/components/product/section-info";

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
  colors?: string[];
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
  title?: string;
  description?: string;
  products: Product[];
  viewAllLink?: string;
  viewAllText?: string;
  layout?: "scroll" | "grid";
  gridCols?: 2 | 3 | 4 | 5 | 6;
  showBadge?: boolean;
  badgeText?: string;
  badgeVariant?: "sale" | "new" | "soldOut" | "limited" | "exclusive";
  sectionSpacing?: "sm" | "default" | "lg";
  sectionBackground?: "none" | "subtle" | "contrast" | "gradient";
  className?: string;
  headerAlign?: "left" | "center" | "right";
  priority?: boolean;
  carouselMode?: boolean; // New prop for carousel-based sections
  integratedHeader?: React.ReactNode; // New prop for integrated header content
  noSection?: boolean; // New prop to skip ProductSection wrapper when used inside unified sections
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
  carouselMode = false,
  integratedHeader,
  noSection = false,
}: ProductShowcaseProps) {
  
  const content = (
    <>
      {/* If integratedHeader is provided, use it instead of the default headers */}
      {integratedHeader ? (
        <>
          {integratedHeader}
          <div className="mb-6 md:mb-8" /> {/* Consistent spacing between header and products */}
        </>
      ) : carouselMode ? (
        // Carousel mode: only show compact section info
        <SectionInfo
          description={description}
          viewAllText={viewAllText}
          {...(viewAllLink && { viewAllHref: viewAllLink })}
        />
      ) : (
        // Traditional mode: show full header
        <ProductHeader
          title={title}
          {...(description && { description })}
          viewAllText={viewAllText}
          {...(viewAllLink && { viewAllHref: viewAllLink })}
          align={headerAlign}
          {...(showBadge && badgeText && { badgeText, badgeVariant })}
        />
      )}
      
      {layout === "scroll" ? (
        <ProductScroll showControls controlsPosition="outside">
          {products.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              priority={priority && index < 4}
            />
          ))}
        </ProductScroll>
      ) : (
        // Grid layout for all screen sizes
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
    </>
  );

  // If noSection is true, return content without ProductSection wrapper
  if (noSection) {
    return <div className={className}>{content}</div>;
  }

  // Default behavior with ProductSection wrapper
  return (
    <ProductSection size={sectionSpacing} background={sectionBackground} className={className}>
      {content}
    </ProductSection>
  );
}