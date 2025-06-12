"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store"
import { useMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { SizeGuideModal } from "@/components/size-guide-modal"
import { ProductImageGallery } from "./product-image-gallery"
import { ProductDetails } from "./product-details"
import { ProductActions } from "./product-actions"

type Product = {
  id: string
  name: string
  price: string
  originalPrice?: string
  discount?: string
  image: string
  images?: string[]
  isNew?: boolean
  soldOut?: boolean
  slug: string
  colors?: number
  description?: string
  sizes?: string[]
  sku?: string
  variants?: Array<{
    id: string
    title: string
    sku?: string
    prices?: any[]
  }>
}

export interface ProductQuickViewProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
  const isMobile = useMobile()

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          {product && <QuickViewContent product={product} onClose={onClose} />}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Product Quick View</DialogTitle>
          <DialogDescription>View product details and add to cart</DialogDescription>
        </VisuallyHidden>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        {product && <QuickViewContent product={product} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function QuickViewContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdded, setIsAdded] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)

  const { addItem, openCart } = useCartStore()
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlistStore()

  const [isProductWishlisted, setIsProductWishlisted] = useState(false)

  // Reset state when product changes
  useEffect(() => {
    setSelectedSize(null)
    setQuantity(1)
    setCurrentImageIndex(0)
    setIsAdded(false)
    setIsSizeGuideOpen(false)
  }, [product?.id])

  useEffect(() => {
    if (product && isInWishlist) {
      setIsProductWishlisted(isInWishlist(product.id))
    }
  }, [product, isInWishlist, wishlist])

  if (!product) return null

  const productImages = product.images || [product.image]
  const sizes = product.sizes || ["XS", "S", "M", "L", "XL"]

  const handleAddToCart = () => {
    if (!selectedSize || product.soldOut || isAdded) return

    // Find the actual variant ID based on the selected size
    let variantId: string | null = null
    
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => {
        return v.title.toLowerCase().includes(selectedSize.toLowerCase())
      })
      
      if (variant) {
        variantId = variant.id
      } else {
        variantId = product.variants[0].id
      }
    }
    
    if (!variantId) {
      return
    }
    
    try {
      const unitPrice = parseFloat(product.price.replace(/[^0-9.]/g, ""))
      const originalUnitPrice = product.originalPrice ? 
        parseFloat(product.originalPrice.replace(/[^0-9.]/g, "")) : undefined

      addItem({
        variantId: variantId,
        name: product.name,
        image: product.image,
        slug: product.slug,
        size: selectedSize,
        quantity: quantity,
        sku: product.sku,
        unitPrice,
        originalUnitPrice,
      })

      setIsAdded(true)
      setTimeout(() => {
        setIsAdded(false)
        onClose()
        setTimeout(() => {
          openCart()
        }, 100)
      }, 1500)
    } catch (error) {
      setIsAdded(false)
    }
  }

  const handleWishlistToggle = () => {
    if (!product || !addToWishlist || !removeFromWishlist || !isInWishlist) return

    const wishlistItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    }
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(wishlistItem)
    }
    
    setIsProductWishlisted(!isProductWishlisted)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[90vh] lg:max-h-none">
        {/* Product Images */}
        <ProductImageGallery
          images={productImages}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          productName={product.name}
          badges={{
            discount: product.discount,
            isNew: product.isNew,
            soldOut: product.soldOut,
          }}
        />

        {/* Product Details & Actions */}
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <ProductDetails
              product={product}
              isWishlisted={isProductWishlisted}
              onWishlistToggle={handleWishlistToggle}
            />

            <ProductActions
              sizes={sizes}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              isAdded={isAdded}
              isSoldOut={product.soldOut}
              onSizeGuideOpen={() => setIsSizeGuideOpen(true)}
            />
          </div>

          {/* Footer */}
          <div className="border-t p-4 lg:p-6">
            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="text-[10px] underline hover:no-underline uppercase tracking-wider text-center block"
            >
              View Full Product Details
            </Link>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setIsSizeGuideOpen(false)} 
      />
    </>
  )
}