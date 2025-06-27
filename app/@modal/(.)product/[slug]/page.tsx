'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useEffect, useState, use } from 'react';
import { ProductQuickView } from '@/components/product/quick-view';
import { MedusaProductService } from '@/lib/medusa-service-refactored';

interface ProductModalProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductModal({ params }: ProductModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [product, setProduct] = useState<any>(null);
  
  // Use React.use() to unwrap the params promise
  const resolvedParams = use(params);

  useEffect(() => {
    async function fetchProduct() {
      try {
        // Try to fetch real product from Medusa
        const products = await MedusaProductService.getProducts({ limit: 100 });
        
        if (products.products && products.products.length > 0) {
          const medusaProduct = products.products[0];
          
          if (!medusaProduct) {
            throw new Error('Product not found');
          }
          
          // Transform Medusa product to expected format
          const lowestPrice = MedusaProductService.getLowestPrice(medusaProduct);
          const transformedProduct = {
            id: medusaProduct.id,
            name: medusaProduct.title || resolvedParams.slug.split('-').map(word => word.toUpperCase()).join(' '),
            price: MedusaProductService.formatPrice(
              lowestPrice?.amount || 0,
              lowestPrice?.currency || 'GBP'
            ),
            originalPrice: medusaProduct.metadata?.originalPrice ? 
              MedusaProductService.formatPrice(
                parseInt(medusaProduct.metadata.originalPrice as string),
                lowestPrice?.currency || 'GBP'
              ) : undefined,
            discount: medusaProduct.metadata?.discount as string || undefined,
            image: medusaProduct.thumbnail || medusaProduct.images?.[0]?.url || '/placeholder.svg?height=800&width=600',
            images: medusaProduct.images?.map(img => img.url) || [
              medusaProduct.thumbnail || '/placeholder.svg?height=800&width=600'
            ],
            isNew: medusaProduct.metadata?.isNew === true,
            soldOut: medusaProduct.variants?.every(v => v.inventory_quantity === 0) || false,
            slug: resolvedParams.slug,
            colors: medusaProduct.variants?.length || 1,
            description: medusaProduct.description || 'Premium quality product with exceptional design and craftsmanship.',
            sizes: medusaProduct.options?.find(o => o.title.toLowerCase() === 'size')?.values.map(v => v.value) || ['XS', 'S', 'M', 'L', 'XL'],
            sku: medusaProduct.variants?.[0]?.sku || `SKU-${resolvedParams.slug.toUpperCase()}`,
            variants: medusaProduct.variants?.map(v => ({
              id: v.id,
              title: v.title || 'Default',
              sku: v.sku,
              prices: v.prices,
            })) || [],
          };
          
          setProduct(transformedProduct);
        } else {
          // Fallback to mock product if not found
          const mockProduct = {
            id: resolvedParams.slug,
            name: resolvedParams.slug.split('-').map(word => word.toUpperCase()).join(' '),
            price: '£299',
            originalPrice: '£399',
            discount: '-25%',
            image: '/placeholder.svg?height=800&width=600',
            images: [
              '/placeholder.svg?height=800&width=600',
              '/placeholder.svg?height=800&width=600',
              '/placeholder.svg?height=800&width=600',
            ],
            isNew: false,
            soldOut: false,
            slug: resolvedParams.slug,
            colors: 3,
            description: 'Premium quality product with exceptional design and craftsmanship.',
            sizes: ['XS', 'S', 'M', 'L', 'XL'],
            sku: `SKU-${resolvedParams.slug.toUpperCase()}`,
            variants: [
              { id: 'v1', title: 'XS', sku: `${resolvedParams.slug}-xs`, prices: [] },
              { id: 'v2', title: 'S', sku: `${resolvedParams.slug}-s`, prices: [] },
              { id: 'v3', title: 'M', sku: `${resolvedParams.slug}-m`, prices: [] },
              { id: 'v4', title: 'L', sku: `${resolvedParams.slug}-l`, prices: [] },
              { id: 'v5', title: 'XL', sku: `${resolvedParams.slug}-xl`, prices: [] },
            ],
          };
          setProduct(mockProduct);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        // Fallback to mock on error
        const mockProduct = {
          id: resolvedParams.slug,
          name: resolvedParams.slug.split('-').map(word => word.toUpperCase()).join(' '),
          price: '£299',
          originalPrice: '£399',
          discount: '-25%',
          image: '/placeholder.svg?height=800&width=600',
          images: [
            '/placeholder.svg?height=800&width=600',
            '/placeholder.svg?height=800&width=600',
            '/placeholder.svg?height=800&width=600',
          ],
          isNew: false,
          soldOut: false,
          slug: resolvedParams.slug,
          colors: 3,
          description: 'Premium quality product with exceptional design and craftsmanship.',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          sku: `SKU-${resolvedParams.slug.toUpperCase()}`,
          variants: [
            { id: 'v1', title: 'XS', sku: `${resolvedParams.slug}-xs`, prices: [] },
            { id: 'v2', title: 'S', sku: `${resolvedParams.slug}-s`, prices: [] },
            { id: 'v3', title: 'M', sku: `${resolvedParams.slug}-m`, prices: [] },
            { id: 'v4', title: 'L', sku: `${resolvedParams.slug}-l`, prices: [] },
            { id: 'v5', title: 'XL', sku: `${resolvedParams.slug}-xl`, prices: [] },
          ],
        };
        setProduct(mockProduct);
      } finally {
      }
    }
    
    fetchProduct();
  }, [resolvedParams.slug]);

  const handleClose = () => {
    setIsOpen(false);
    // Small delay before navigation to allow animation
    setTimeout(() => router.back(), 150);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-6xl w-full h-[85vh] min-h-[600px] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Product Quick View</DialogTitle>
          <DialogDescription>View product details and add to cart</DialogDescription>
        </VisuallyHidden>
        <ProductQuickView product={product} isOpen={true} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}