import Header from '@/components/header';
import Footer from '@/components/footer';
import CategoryPageClient from '@/components/category-page-client';
import { QuickViewProvider } from '@/contexts/QuickViewContext';
import { QuickViewModal } from '@/components/QuickViewModal';
import { generateCategoryMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

// Define available categories
const CATEGORIES = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  sale: 'Sale',
  'new-arrivals': 'New Arrivals',
  sneakers: 'Sneakers',
  accessories: 'Accessories',
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'https://strike-shop.com';
  return generateCategoryMetadata(
    params.category,
    `${baseUrl}/${params.category}`
  );
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params;
  const categoryName =
    CATEGORIES[category as keyof typeof CATEGORIES] ||
    category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Generate mock products for the category
  const products = Array.from({ length: 24 }, (_, i) => {
    const basePrice = Math.floor(Math.random() * 400) + 50;
    const hasDiscount = Math.random() > 0.7;
    const originalPrice = hasDiscount
      ? basePrice + Math.floor(Math.random() * 200) + 50
      : undefined;

    const product: any = {
      id: `${category}-${i + 1}`,
      name: `${categoryName.toUpperCase()} STYLE ${String.fromCharCode(65 + (i % 26))}`,
      price: `£${basePrice}`,
      image: `/placeholder.svg?height=400&width=300&query=${category}+style+${i + 1}`,
      isNew: Math.random() > 0.8,
      slug: `${category}-style-${i + 1}`,
      colors: Math.floor(Math.random() * 4) + 1,
    };

    if (originalPrice) {
      product.originalPrice = `£${originalPrice}`;
    }

    if (hasDiscount && originalPrice) {
      product.discount = `-${Math.floor(((originalPrice - basePrice) / originalPrice) * 100)}%`;
    }

    return product;
  });

  return (
    <QuickViewProvider>
      <main className="bg-white">
        <Header />
        <CategoryPageClient
          categoryName={categoryName}
          initialProducts={products}
        />
        <Footer />
      </main>
      <QuickViewModal />
    </QuickViewProvider>
  );
}
