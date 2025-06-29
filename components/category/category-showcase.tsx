"use client";

import * as React from "react";
import { CategorySection, CategoryScroll, CategoryCard } from "@/components/category";
import { SectionHeader } from "@/components/ui/section-header";
import { type CategoryItem, type CategoryConfig, defaultCategoryConfig } from "@/config/categories";

interface CategoryShowcaseProps extends CategoryConfig {
  categories: CategoryItem[];
  className?: string;
  variant?: "scroll" | "grid" | "carousel";
  sectionProps?: React.ComponentProps<typeof CategorySection>;
  cardProps?: Partial<React.ComponentProps<typeof CategoryCard>>;
}

export function CategoryShowcase({
  categories,
  title = defaultCategoryConfig.title,
  viewAllText = defaultCategoryConfig.viewAllText,
  viewAllHref = defaultCategoryConfig.viewAllHref,
  className,
  variant = "scroll",
  sectionProps,
  cardProps,
}: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <CategorySection {...sectionProps} className={className}>
      <SectionHeader
        title={title || ''}
        {...(viewAllText && { ctaText: viewAllText })}
        {...(viewAllHref && { ctaHref: viewAllHref })}
      />
      
      {variant === "scroll" && (
        <CategoryScroll showControls controlsPosition="outside">
          {categories.map((category, index) => (
            <div key={category.id} className="flex-none w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px]">
              <CategoryCard
                category={{
                  ...category,
                  count: category.count || 0
                }}
                priority={index < 3}
                {...cardProps}
              />
            </div>
          ))}
        </CategoryScroll>
      )}
    </CategorySection>
  );
}