'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product/product-card';
import { ShopifyService } from '@/lib/shopify/services';
import type { IntegratedProduct } from '@/types';

interface RelatedProductsProps {
  productId: string;
  maxProducts?: number;
}

export function RelatedProducts({ productId, maxProducts = 4 }: RelatedProductsProps) {
  const [products, setProducts] = useState<IntegratedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all products and filter out the current product
        const allProducts = await ShopifyService.getProducts(20);
        const relatedProducts = allProducts
          .filter(product => product.id !== productId)
          .slice(0, maxProducts);
        
        setProducts(relatedProducts);
      } catch (err) {
        console.error('Error fetching related products:', err);
        setError('Failed to load related products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, maxProducts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-4 animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No related products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            name: product.content.name,
            price: product.pricing.displayPrice,
            image: product.content.images[0]?.url || '/placeholder.svg',
          }}
          className="h-full"
        />
      ))}
    </div>
  );
}