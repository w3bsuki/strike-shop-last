import { Suspense } from 'react';
import { ShopifyService } from '@/lib/shopify/services';
import { createCategoryId, createImageURL, createSlug } from '@/types';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import Link from 'next/link';
import Image from 'next/image';
// import { CategoryCard } from '@/components/category';
import { CategoryScrollSkeleton } from '@/components/ui/loading-states';
import { MobileNav } from '@/components/mobile/navigation';

async function getCollections() {
  try {
    const collections = await ShopifyService.getCollections();
    return collections.map(collection => ({
      id: createCategoryId(collection.id),
      name: collection.name.toUpperCase(),
      count: collection.products.length,
      image: createImageURL(collection.image?.url || 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop&crop=center&q=80'),
      slug: createSlug(collection.slug),
      description: collection.description,
    }));
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

export const metadata = {
  title: 'Collections | STRIKE™',
  description: 'Browse our curated collections of premium streetwear',
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="strike-container py-8">
            <h1 className="text-2xl md:text-3xl font-typewriter font-bold uppercase tracking-wider">
              Collections
            </h1>
            <p className="text-sm text-gray-600 mt-2 font-typewriter">
              Browse our curated selection of premium streetwear
            </p>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="strike-container py-8">
          <Suspense fallback={<CategoryScrollSkeleton />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <h3 className="text-xl md:text-2xl font-typewriter font-bold uppercase tracking-wider">
                        {collection.name}
                      </h3>
                      <p className="text-sm font-typewriter mt-2">
                        {collection.count} items
                      </p>
                    </div>
                  </div>
                  {collection.description && (
                    <p className="mt-3 text-sm text-gray-600 font-typewriter line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>

            {collections.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 font-typewriter">
                  No collections available at the moment.
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </main>
      <Footer />
      <MobileNav variant="default" showLabels={true} showThreshold={0} />
    </>
  );
}