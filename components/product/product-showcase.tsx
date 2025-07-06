import * as React from "react";
import { ProductSection } from "./product-section";
import { ProductHeader } from "./product-header";
import { ProductScroll } from "./product-scroll";
import { ProductGrid } from "./product-grid";
import { ProductCard } from "./product-card";
import { ProductBadge } from "./product-badge";
import { SectionInfo } from "./section-info";
import { getPerfectProductCardClasses } from "@/lib/layout/config";

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
              className={getPerfectProductCardClasses('carousel')}
              priority={priority && index < 4}
            />
          ))}
        </ProductScroll>
      ) : (
        <>
          {/* Mobile: Horizontal scroll */}
          <div className="block lg:hidden">
            <ProductScroll showControls={false} controlsPosition="outside">
              {products.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  className={getPerfectProductCardClasses('carousel')}
                  priority={priority && index < 4}
                />
              ))}
            </ProductScroll>
          </div>
          
          {/* Desktop: Grid layout */}
          <div className="hidden lg:block px-4 sm:px-4 lg:px-6 max-w-[1440px] mx-auto">
            <ProductGrid cols={gridCols}>
              {products.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  className={getPerfectProductCardClasses('grid')}
                  priority={priority && index < gridCols}
                />
              ))}
            </ProductGrid>
          </div>
        </>
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