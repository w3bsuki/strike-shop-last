'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ProductDetailsProps {
  product: {
    name: string;
    price: string;
    originalPrice?: string;
    sku?: string;
    description?: string;
    colors?: number;
  };
  isWishlisted: boolean;
  onWishlistToggle: () => void;
}

export function ProductDetails({
  product,
  isWishlisted,
  onWishlistToggle,
}: ProductDetailsProps) {
  const description =
    product.description ||
    'Premium quality streetwear piece crafted with attention to detail and modern design aesthetics.';

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="space-y-4 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-wider">
            "{product.name}"
          </h1>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg lg:text-xl font-bold">
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-[var(--subtle-text-color)] line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
          {product.sku && (
            <p className="text-xs text-[var(--subtle-text-color)] font-mono">
              SKU: {product.sku}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onWishlistToggle}
          className="ml-4"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`h-5 w-5 ${
              isWishlisted ? 'fill-current text-red-500' : ''
            }`}
          />
        </Button>
      </div>

      {product.colors && product.colors > 1 && (
        <p className="text-[10px] text-[var(--subtle-text-color)]">
          AVAILABLE IN {product.colors} COLORS
        </p>
      )}

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="description">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider py-3">
            "DESCRIPTION"
          </AccordionTrigger>
          <AccordionContent className="text-xs text-[var(--subtle-text-color)] leading-relaxed">
            {description}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="details">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider py-3">
            "DETAILS & CARE"
          </AccordionTrigger>
          <AccordionContent className="text-xs text-[var(--subtle-text-color)] leading-relaxed">
            <ul className="space-y-1">
              <li>• 100% Organic Cotton</li>
              <li>• Machine wash cold</li>
              <li>• Tumble dry low</li>
              <li>• Do not bleach</li>
              <li>• Iron on low heat</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider py-3">
            "SHIPPING & RETURNS"
          </AccordionTrigger>
          <AccordionContent className="text-xs text-[var(--subtle-text-color)] leading-relaxed">
            <p className="mb-2">
              Free shipping on orders over £100. Standard delivery takes 3-5
              business days.
            </p>
            <p>
              Free returns within 30 days. Items must be unworn with tags
              attached.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
