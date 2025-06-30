'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { Skeleton } from '@/components/ui/loading-skeleton';
import { handleError } from '@/lib/error-handling';

interface ProductPageProps {
  product: any; // Product type
}

export default function ProductPageClient({ product }: ProductPageProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const wishlist = useWishlist();
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { addItem: addToCart } = useCartActions();
  const [isProductPageItemWishlisted, setIsProductPageItemWishlisted] =
    useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [imageError, setImageError] = useState<number[]>([]);

  useEffect(() => {
    if (product && wishlist.items) {
      setIsProductPageItemWishlisted(wishlist.items.some(item => item.id === product.id));
    }
  }, [product, wishlist.items]);

  if (!product) {
    return <div>Product not found</div>;
  }

  const images = product.images || [];
  const currentImage = images[currentImageIndex];

  const toggleWishlist = () => {
    if (isProductPageItemWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.title,
        price: product.variants?.[0]?.prices?.[0]?.amount?.toString() || '0',
        image: product.thumbnail || '',
        slug: product.handle || '',
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

  const productJsonLd = {
    title: product.title,
    description: product.description || '',
    image: product.thumbnail || images[0]?.url || '',
    price: product.variants?.[0]?.prices?.[0]?.amount || 0,
    currency: 'GBP',
    availability: 'in stock',
    brand: 'STRIKE™',
  };

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData(productJsonLd)),
        }}
      />
      
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Image Gallery */}
            <div>
              <div className="relative mb-4 aspect-square overflow-hidden bg-gray-100">
                {isLoadingImages && (
                  <Skeleton className="absolute inset-0" />
                )}
                {currentImage && !imageError.includes(currentImageIndex) ? (
                  <Image
                    src={currentImage.url}
                    alt={product.title}
                    fill
                    className={`object-cover transition-opacity duration-300 ${
                      isLoadingImages ? 'opacity-0' : 'opacity-100'
                    }`}
                    priority
                    onLoad={() => setIsLoadingImages(false)}
                    onError={() => {
                      setImageError(prev => [...prev, currentImageIndex]);
                      setIsLoadingImages(false);
                    }}
                  />
                ) : (
                  !isLoadingImages && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <p>No image available</p>
                        {imageError.includes(currentImageIndex) && (
                          <p className="text-sm mt-2">Failed to load image</p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
              {images && images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square overflow-hidden bg-gray-100 ${
                        currentImageIndex === index
                          ? 'ring-2 ring-black'
                          : ''
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                <p className="text-2xl font-medium">
                  £{((product.variants?.[0]?.prices?.[0]?.amount || 0) / 100).toFixed(2)}
                </p>
              </div>

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Size</label>
                    <SizeGuideModal />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sizes.map((size: any) => (
                      <button
                        key={size.value}
                        onClick={() => setSelectedSize(size.value)}
                        className={`py-3 border transition-colors ${
                          selectedSize === size.value
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size.value}
                      </button>
                    ))}
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
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart & Wishlist */}
              <div className="flex gap-4 mb-8">
                <Button
                  className="flex-1 bg-black hover:bg-gray-800 text-white py-6"
                  disabled={(sizes.length > 0 && !selectedSize) || isAddingToCart}
                  onClick={handleAddToCart}
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
                <Button
                  variant="outline"
                  size="icon"
                  className="w-14 h-14"
                  onClick={toggleWishlist}
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
                    <p className="text-gray-600">
                      {product.description || 'No description available.'}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm text-gray-600">
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
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-20 w-full" />
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
            {/* TODO: Fetch related products based on collection_id */}
            <div className="text-center py-8">
              <p className="text-muted-foreground">Related products coming soon</p>
            </div>
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