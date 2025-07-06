import React from 'react';
import { CategoryCardDefault } from './category-card-default';
import { CategoryCardFeatured } from './category-card-featured';
import { CategoryCardMinimal } from './category-card-minimal';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    count: number;
    image: string;
    slug: string;
    description?: string;
  };
  variant?: 'default' | 'featured' | 'minimal';
  priority?: boolean;
}

export const CategoryCard = React.memo(({ 
  category, 
  variant = 'default',
  priority = false
}: CategoryCardProps) => {
  switch (variant) {
    case 'featured':
      return <CategoryCardFeatured category={category} priority={priority} />;
    case 'minimal':
      return <CategoryCardMinimal category={category} />;
    default:
      return <CategoryCardDefault category={category} priority={priority} />;
  }
});

CategoryCard.displayName = 'CategoryCard';