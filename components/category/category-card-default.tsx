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

export const CategoryCardDefault = React.memo(({ 
  category, 
  priority = false
}: CategoryCardProps) => {
  return (
    <Link 
      href={`/${category.slug}`}
      className="group relative overflow-hidden rounded-none bg-white border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[4/3] relative">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <h3 className="text-xl font-bold mb-2">{category.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-90">{category.count} products</span>
          <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
});

CategoryCardDefault.displayName = 'CategoryCardDefault';