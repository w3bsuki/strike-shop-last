import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    count: number;
    image: string;
    slug: string;
    description?: string;
  };
}

export const CategoryCardMinimal = React.memo(({ category }: CategoryCardProps) => {
  return (
    <Link 
      href={`/${category.slug}`}
      className="group flex items-center justify-between p-spacing-4 border-b border-border hover:bg-muted/50 transition-colors"
    >
      <div>
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {category.count} products
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
    </Link>
  );
});

CategoryCardMinimal.displayName = 'CategoryCardMinimal';