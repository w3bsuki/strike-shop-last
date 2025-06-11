"use client"

import { useState, useEffect } from "react" // Added useEffect
import Image from "next/image"
import { X, Heart, Minus, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store"
import { useMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SizeGuideModal } from "./size-guide-modal" // Import SizeGuideModal

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
}

interface ProductQuickViewProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

function QuickViewContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdded, setIsAdded] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false) // State for size guide modal

  const { addItem, openCart } = useCartStore()
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlistStore() // Corrected: isInWishlist

  // State to manage wishlist status, ensuring it updates when store changes
  const [isProductWishlisted, setIsProductWishlisted] = useState(false)

  useEffect(() => {
    if (product && isInWishlist) {
      setIsProductWishlisted(isInWishlist(product.id))
    }
  }, [product, isInWishlist, wishlist]) // Depend on wishlist to re-check

  if (!product) return null // Added null check for product

  const productImages = product.images || [product.image]
  const sizes = product.sizes || ["XS", "S", "M", "L", "XL"]
  const description =
    product.description ||
    "Premium quality streetwear piece crafted with attention to detail and modern design aesthetics."

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const handleAddToCart = () => {
    if (!selectedSize || product.soldOut || isAdded) return

    addItem({
      variantId: product.id,
      name: product.name,
      unitPrice: parseFloat(product.price.replace(/[^0-9.]/g, '')) * 100, // Convert to cents
      originalUnitPrice: product.originalPrice ? parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')) * 100 : undefined,
      image: product.image,
      slug: product.slug,
      size: selectedSize,
      quantity,
      sku: product.sku,
    })

    setIsAdded(true)
    setTimeout(() => {
      onClose()
      openCart()
      setIsAdded(false)
    }, 1500)
  }

  const handleWishlistToggle = () => {
    if (!product || !addToWishlist || !removeFromWishlist || !isInWishlist) return // Safety check

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
    // Update local state immediately for responsiveness
    setIsProductWishlisted(!isProductWishlisted)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[90vh] lg:max-h-none">
        {/* Product Images */}
        <div className="relative bg-gray-50">
          <div className="relative aspect-square lg:aspect-auto lg:h-full">
            <Image
              src={productImages[currentImageIndex] || "/placeholder.svg"}
              alt={`${product.name} - View ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
            {productImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
            <div className="absolute top-4 left-4 space-y-2">
              {product.discount && (
                <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                  {product.discount}
                </span>
              )}
              {product.isNew && !product.discount && (
                <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">NEW</span>
              )}
              {product.soldOut && (
                <span className="bg-gray-600 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                  SOLD OUT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="space-y-4 mb-6">
              <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-wider">"{product.name}"</h1>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg lg:text-xl font-bold">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-sm text-[var(--subtle-text-color)] line-through">{product.originalPrice}</span>
                )}
              </div>
              {product.sku && <p className="text-xs text-[var(--subtle-text-color)] font-mono">SKU: {product.sku}</p>}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider">"SIZE"</h3>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[10px] underline hover:no-underline text-[var(--subtle-text-color)]"
                >
                  SIZE GUIDE
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`border p-2.5 text-xs font-medium transition-colors ${
                      selectedSize === size ? "bg-black text-white border-black" : "border-subtle hover:border-black"
                    } ${product.soldOut ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !product.soldOut && setSelectedSize(size)}
                    disabled={product.soldOut}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && !product.soldOut && (
                <p className="text-xs text-red-600 text-center">Please select a size</p>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider">"QUANTITY"</h3>
              <div className="flex items-center space-x-3">
                <button
                  className="border border-subtle p-2 hover:border-black disabled:opacity-50"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || product.soldOut}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                <button
                  className="border border-subtle p-2 hover:border-black disabled:opacity-50"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={product.soldOut}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="py-3 text-xs font-bold uppercase tracking-wider hover:no-underline">
                  Description
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 text-xs text-gray-700 leading-relaxed">
                  {description}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="py-3 text-xs font-bold uppercase tracking-wider hover:no-underline">
                  Composition & Care
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 text-xs text-gray-700 leading-relaxed">
                  Main: 100% Premium Cotton. Machine wash cold. Do not bleach. Tumble dry low.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border-t border-subtle p-6 lg:p-8 space-y-3">
            <Button
              className="button-primary w-full !py-3"
              disabled={!selectedSize || product.soldOut || isAdded}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Added!
                </>
              ) : product.soldOut ? (
                "SOLD OUT"
              ) : selectedSize ? (
                "ADD TO BAG"
              ) : (
                "SELECT A SIZE"
              )}
            </Button>
            <Button
              onClick={handleWishlistToggle}
              className="button-secondary w-full !py-3 flex items-center justify-center"
            >
              <Heart
                className={`h-4 w-4 mr-2 transition-colors ${isProductWishlisted ? "fill-red-500 text-red-500" : "text-black"}`}
              />
              {isProductWishlisted ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST"}
            </Button>
            <Link href={`/product/${product.slug}`} className="block">
              <Button
                variant="outline"
                className="w-full !py-3 text-xs font-bold uppercase tracking-wider border-subtle hover:border-black"
              >
                VIEW FULL DETAILS
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </>
  )
}

export default function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
  const isMobile = useMobile()

  if (!isOpen || !product) return null

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-white p-0 border-none max-h-[95vh]">
          {" "}
          {/* Added max-h for mobile drawer */}
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
              aria-label="Close quick view"
            >
              <X className="h-5 w-5" />
            </button>
            <QuickViewContent product={product} onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white p-0 border-none max-w-4xl w-full overflow-hidden shadow-2xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            aria-label="Close quick view"
          >
            <X className="h-5 w-5" />
          </button>
          <QuickViewContent product={product} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
