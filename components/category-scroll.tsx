import Link from 'next/link';
import Image from 'next/image';
import { SectionHeader } from '@/components/ui/section-header';

type Category = {
  id: string;
  name: string;
  count: number;
  image: string;
  slug: string;
};

interface CategoryScrollProps {
  title: string;
  categories: Category[];
}

export default function CategoryScroll({
  title,
  categories,
}: CategoryScrollProps) {

  return (
    <section className="py-16 bg-white">
      <div className="strike-container">
        <SectionHeader 
          title={title}
          ctaText="SHOP ALL"
          ctaHref="/categories"
        />

        {/* Universal Horizontal Scroll Layout */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4 min-w-max">
            {categories.map((category, index) => (
              <Link
                href={`/${category.slug}`}
                key={category.id}
                className="group block flex-shrink-0"
              >
                <div className="relative w-48 h-64 bg-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                  <Image
                    src={category.image}
                    alt={`${category.name} category`}
                    fill
                    className="object-cover filter brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                    sizes="192px"
                    priority={index < 3}
                  />
                  
                  {/* Sophisticated overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                  
                  {/* Text content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-typewriter text-lg font-bold uppercase tracking-wider mb-1 transform group-hover:translate-y-[-2px] transition-transform duration-300">
                      {category.name}
                    </h3>
                    <p className="text-white/80 font-typewriter text-xs uppercase tracking-wide">
                      {category.count} items
                    </p>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
