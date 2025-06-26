"use client";

import * as React from "react";
import { CategorySection, CategoryHeader, CategoryScroll, CategoryCard } from "@/components/category";
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
      <CategoryHeader
        title={title}
        viewAllText={viewAllText}
        viewAllHref={viewAllHref}
      />
      
      {variant === "scroll" && (
        <CategoryScroll showControls controlsPosition="outside">
          {categories.map((category, index) => (
            <div key={category.id} className="flex-none w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px]">
              <CategoryCard
                name={category.name}
                image={category.image}
                href={`/${category.slug}`}
                count={category.count}
                description={category.description}
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