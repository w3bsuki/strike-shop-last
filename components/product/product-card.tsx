import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { WishlistButton } from "./wishlist-button"
import type { IntegratedProduct } from "@/types/integrated"

interface ProductCardProps {
  product: IntegratedProduct
  priority?: boolean
}

/**
 * Server Component - Product Card
 * Displays product information without client-side interactivity
 * The WishlistButton is a separate client component for interactivity
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { content, pricing, badges } = product
  const mainImage = content.images?.[0]
  
  return (
    <Card className="group relative overflow-hidden border-0 shadow-none rounded-none">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {mainImage && (
            <Image
              src={
                typeof mainImage === 'string' 
                  ? mainImage 
                  : (mainImage.asset && 'url' in mainImage.asset) 
                    ? mainImage.asset.url 
                    : '/placeholder.svg'
              }
              alt={content.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1 z-10">
            {badges.isSale && pricing.discount && (
              <span className="block bg-red-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                -{pricing.discount.percentage}%
              </span>
            )}
            {badges.isNew && (
              <span className="block bg-black text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                NEW
              </span>
            )}
            {badges.isSoldOut && (
              <span className="block bg-gray-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                SOLD OUT
              </span>
            )}
          </div>
        </div>
        
        <div className="p-2 space-y-1">
          <h3 className="text-sm font-medium line-clamp-2 uppercase tracking-wide">
            {content.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold">{pricing.displayPrice}</span>
            {pricing.displaySalePrice && (
              <span className="text-xs text-muted-foreground line-through">
                {pricing.displaySalePrice}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Client Component for wishlist interaction */}
      <WishlistButton 
        product={{
          id: product.id,
          name: content.name,
          price: pricing.displayPrice,
          image: typeof mainImage === 'string' 
            ? mainImage 
            : (mainImage?.asset && 'url' in mainImage.asset) 
              ? mainImage.asset.url 
              : '/placeholder.svg',
          slug: product.slug,
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </Card>
  )
}