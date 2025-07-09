'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useEffect, useState, use } from 'react';
import { ProductQuickView } from '@/components/product/quick-view';
import { ShopifyService } from '@/lib/shopify/services';

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
        // Try to fetch real product from Shopify
        const shopifyProduct = await ShopifyService.getProductBySlug(resolvedParams.slug);
        
        if (shopifyProduct) {
          // Transform Shopify product to expected format
          const transformedProduct = {
            id: shopifyProduct.id,
            name: shopifyProduct.content?.name || resolvedParams.slug.split('-').map(word => word.toUpperCase()).join(' '),
            price: shopifyProduct.pricing?.displayPrice || '£299',
            originalPrice: shopifyProduct.pricing?.displaySalePrice,
            discount: shopifyProduct.pricing?.discount?.percentage ? `-${shopifyProduct.pricing.discount.percentage}%` : undefined,
            image: shopifyProduct.content?.images?.[0]?.url || '/placeholder.svg?height=800&width=600',
            images: shopifyProduct.content?.images?.map(img => typeof img === 'string' ? img : img.url) || [
              shopifyProduct.content?.images?.[0]?.url || '/placeholder.svg?height=800&width=600'
            ],
            isNew: shopifyProduct.badges?.isNew === true,
            soldOut: shopifyProduct.badges?.isSoldOut === true,
            slug: shopifyProduct.slug,
            colors: shopifyProduct.commerce?.variants?.length || 1,
            description: shopifyProduct.content?.description || 'Premium quality product with exceptional design and craftsmanship.',
            sizes: shopifyProduct.commerce?.variants?.map(v => v.options?.size).filter(Boolean) || ['XS', 'S', 'M', 'L', 'XL'],
            sku: shopifyProduct.commerce?.variants?.[0]?.sku || `SKU-${resolvedParams.slug.toUpperCase()}`,
            variants: shopifyProduct.commerce?.variants?.map(v => ({
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