import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  priority?: boolean;
}

export const CategoryCardFeatured = React.memo(({ 
  category, 
  priority = false
}: CategoryCardProps) => {
  return (
    <Link 
      href={`/${category.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-none bg-white shadow-md hover:shadow-xl transition-all duration-300">
        <div className="aspect-[16/9] relative">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priority}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
        </div>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-6 md:p-8">
          <h3 className="text-3xl font-bold mb-3 transform group-hover:scale-105 transition-transform">
            {category.name}
          </h3>
          <p className="text-lg mb-4 opacity-90">
            {category.count} products
          </p>
          {category.description && (
            <p className="text-sm max-w-md opacity-80 mb-6">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Explore Collection</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
});

CategoryCardFeatured.displayName = 'CategoryCardFeatured';