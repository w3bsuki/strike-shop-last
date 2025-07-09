'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ProductReviews from '@/components/product-reviews';
import { SizeGuideModal } from '@/components/size-guide-modal';
import { useWishlist, useWishlistActions, useCartActions } from '@/lib/stores';
import Script from 'next/script';
import { toast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { handleError } from '@/lib/error-handling';
import { EnhancedProductGallery } from '@/components/product/enhanced-product-gallery';
import { SizeSelector } from '@/components/product/size-selector';
import { RelatedProducts } from '@/components/product/related-products';
// Step 7 optimization - use existing components

interface ProductPageProps {
  product: any; // Product type
}

export default function ProductPageClient({ product }: ProductPageProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const wishlist = useWishlist();
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { addItem: addToCart } = useCartActions();
  const [isProductPageItemWishlisted, setIsProductPageItemWishlisted] =
    useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Step 7: Removed image-related state (currentImageIndex, isLoadingImages, imageError) - handled by gallery component

  // Generate session ID for tracking
  useEffect(() => {
    const generateSessionId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      return `session_${timestamp}_${random}`;
    };

    // Try to get existing session ID from localStorage, or create new one
    const existingSessionId = typeof window !== 'undefined' 
      ? localStorage.getItem('strike_session_id') 
      : null;
      
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('strike_session_id', newSessionId);
      }
    }
  }, []);

  useEffect(() => {
    if (product && wishlist.items) {
      setIsProductPageItemWishlisted(wishlist.items.some(item => item.id === product.id));
    }
  }, [product, wishlist.items]);

  // Track product view for recommendations
  useEffect(() => {
    if (product && sessionId) {
      const trackProductView = async () => {
        try {
          await fetch('/api/tracking/product-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.id,
              sessionId,
              source: 'product_page',
              productName: product.title,
              category: product.category,
              price: product.variants?.[0]?.prices?.[0]?.amount,
              brand: 'STRIKE™'
            })
          });
        } catch (error) {
          console.error('Failed to track product view:', error);
          // Don't throw - tracking failure shouldn't break the page
        }
      };

      // Track view after a short delay to ensure user is engaged
      const timer = setTimeout(trackProductView, 2000);
      return () => clearTimeout(timer);
    }
    // Return undefined when condition is not met
    return undefined;
  }, [product, sessionId]);

  if (!product) {
    return <div>Product not found</div>;
  }

  const images = (product.images || []).filter((img: any) => img?.url && img.url !== '');

  const toggleWishlist = () => {
    if (isProductPageItemWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        productId: product.id,
        variantId: product.variants?.[0]?.id || product.id,
        title: product.title,
        price: parseFloat(product.variants?.[0]?.prices?.[0]?.amount?.toString() || '0'),
        image: product.thumbnail || '',
        addedAt: Date.now(),
      });
    }
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = async () => {
    if (sizes.length > 0 && !selectedSize) {
      toast({
        title: 'Please select a size',
        description: 'Choose a size before adding to cart',
        variant: 'destructive',
      });
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Find the variant based on selected size
      const variant = selectedSize 
        ? product.variants?.find((v: any) => 
            v.options?.some((opt: any) => opt.value === selectedSize)
          ) || product.variants?.[0]
        : product.variants?.[0];

      if (!variant) {
        throw new Error('Product variant not available');
      }

      await addToCart(product.id, variant.id, quantity);
      
      toast({
        title: 'Added to cart',
        description: `${product.title} has been added to your cart`,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const sizes = product.options?.find((opt: any) => opt.title.toLowerCase() === 'size')?.values || [];

  const generateProductJsonLd = () => {
    return {
      title: product.title,
      description: product.description || '',
      image: product.thumbnail || images[0]?.url || '',
      price: product.variants?.[0]?.prices?.[0]?.amount || 0,
      currency: 'GBP',
      availability: 'in stock',
      brand: 'STRIKE™',
    };
  };

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData(generateProductJsonLd())),
        }}
      />
      
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Image Gallery - Step 7: Using existing component (50+ lines removed) */}
            <EnhancedProductGallery 
              images={images.map((img: any) => img.url)} 
              productName={product.title} 
            />

            {/* Product Info */}
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                <p className="text-2xl font-medium">
                  £{((product.variants?.[0]?.prices?.[0]?.amount || 0) / 100).toFixed(2)}
                </p>
              </div>

              {/* Size Selection - Step 7: Using component (20 lines reduced) */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <SizeSelector 
                      sizes={sizes.map((s: any) => s.value)} 
                      selectedSize={selectedSize}
                      onSizeSelect={setSelectedSize}
                      className="flex-1"
                    />
                    <div className="ml-4 mt-6">
                      <SizeGuideModal />
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={decrementQuantity}
                    className="w-10 h-10 flex items-center justify-center border border-primary-300 hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center" aria-live="polite">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 flex items-center justify-center border border-primary-300 hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart & Wishlist */}
              <div className="flex gap-4 mb-8">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-6 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 min-h-[44px]"
                  disabled={(sizes.length > 0 && !selectedSize) || isAddingToCart}
                  onClick={handleAddToCart}
                  aria-describedby="add-to-cart-description"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </Button>
                
                <div id="add-to-cart-description" className="sr-only">
                  {sizes.length > 0 && !selectedSize 
                    ? "Please select a size before adding to cart"
                    : `Add ${quantity} ${product.title} to your cart`
                  }
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="w-14 h-14 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2"
                  onClick={toggleWishlist}
                  aria-label={isProductPageItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isProductPageItemWishlisted ? 'fill-current' : ''
                    }`}
                  />
                </Button>
              </div>

              {/* Product Details */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-primary-600">
                      {product.description || 'No description available.'}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm text-primary-600">
                      <li>• Free shipping on orders over £100</li>
                      <li>• Standard delivery: 3-5 business days</li>
                      <li>• Express delivery: 1-2 business days</li>
                      <li>• Free returns within 30 days</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Reviews Section */}
          <React.Suspense fallback={
            <div className="mt-16">
              <Loading.Skeleton className="h-8 w-48 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border rounded-lg p-4">
                    <Loading.Skeleton className="h-4 w-32 mb-2" />
                    <Loading.Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            </div>
          }>
            <ProductReviews productId={product.id} />
          </React.Suspense>

          {/* Related Products */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <React.Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-4">
                    <Loading.Skeleton className="h-64 w-full rounded-lg" />
                    <Loading.Skeleton className="h-4 w-3/4" />
                    <Loading.Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            }>
              <RelatedProducts productId={product.id} />
            </React.Suspense>
          </section>
        </main>
      </div>
    </>
  );
}

function generateStructuredData(data: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title,
    description: data.description,
    image: data.image,
    offers: {
      '@type': 'Offer',
      price: (data.price / 100).toFixed(2),
      priceCurrency: data.currency,
      availability: `https://schema.org/InStock`,
      seller: {
        '@type': 'Organization',
        name: data.brand,
      },
    },
  };
}