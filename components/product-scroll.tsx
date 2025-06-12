"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react"
import { ProductQuickView } from "./product-quick-view"
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store"
import { Button } from "@/components/ui/button"

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

interface ProductScrollProps {
  title: string
  products: Product[]
  viewAllLink?: string
}

export default function ProductScroll({ title, products, viewAllLink }: ProductScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)


  // Fix: Use the correct function names from the wishlist store
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollability()
    window.addEventListener("resize", checkScrollability)
    return () => window.removeEventListener("resize", checkScrollability)
  }, [products])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
      setTimeout(checkScrollability, 350)
    }
  }

  const openQuickView = (product: Product) => {
    if (!product) {
      console.error('No product data provided to openQuickView')
      return
    }
    const enhancedProduct = {
      ...product,
      images: product.images || [
        product.image,
        product.image.replace("300", "301"),
        product.image.replace("300", "302"),
      ],
      description: product.description || `Premium ${product.name.toLowerCase()} crafted with attention to detail and modern design aesthetics. Features high-quality materials and contemporary styling.`,
      sizes: product.sizes || ["XS", "S", "M", "L", "XL"],
      sku: product.sku || `STR${product.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}${Math.floor(Math.random() * 1000)}`,
      variants: product.variants, // Pass through the variants array with real IDs
    }
    setQuickViewProduct(enhancedProduct)
    setIsQuickViewOpen(true)
  }

  const closeQuickView = () => {
    setIsQuickViewOpen(false)
    // Delay clearing the product to allow dialog animation to complete
    setTimeout(() => {
      setQuickViewProduct(null)
    }, 300)
  }

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    const wishlistItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    }

    // Safe check and use the correct function name
    if (isInWishlist && addToWishlist && removeFromWishlist) {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id)
      } else {
        addToWishlist(wishlistItem)
      }
    }
  }

  return (
    <>
      <section className="section-padding">
        <div className="strike-container">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">"{title}"</h2>
            <div className="flex items-center space-x-2">
              {viewAllLink && (
                <Link href={viewAllLink} className="hidden sm:flex">
                  <Button variant="strike-text" className="text-xs">
                    VIEW ALL <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
              <div className="hidden md:flex space-x-2">
                {canScrollLeft && (
                  <button
                    onClick={() => scroll("left")}
                    className="p-1.5 border border-subtle hover:border-black"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {canScrollRight && (
                  <button
                    onClick={() => scroll("right")}
                    className="p-1.5 border border-subtle hover:border-black"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 md:gap-4 pb-1 horizontal-scroll"
            onScroll={checkScrollability}
          >
            {products.map((product) => {
              // Safe check for wishlist status
              const isWishlistedState = isInWishlist ? isInWishlist(product.id) : false

              return (
                <div
                  key={product.id}
                  className="product-card flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[18vw] max-w-[240px] group"
                >
                  <div className="product-card-image-wrapper">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={240}
                      height={320}
                      className="product-card-image"
                    />
                    {product.discount && <div className="product-card-discount">{product.discount}</div>}
                    {product.isNew && !product.discount && <div className="product-card-new">NEW</div>}
                    {product.soldOut && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">
                        SOLD OUT
                      </div>
                    )}

                    <button
                      className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openQuickView(product)
                      }}
                      aria-label="Quick view"
                    >
                      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full transform scale-90 group-hover:scale-100 transition-transform pointer-events-none">
                        <Eye className="h-4 w-4 text-black" />
                      </div>
                    </button>

                    <button
                      className={`product-card-wishlist ${isWishlistedState ? "text-red-500 bg-red-500/10" : "text-black"}`}
                      onClick={(e) => handleWishlistToggle(e, product)}
                      aria-label="Add to wishlist"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 transition-colors ${
                          isWishlistedState ? "fill-red-500 text-red-500" : "text-black"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="product-card-content">
                    <Link href={`/product/${product.slug}`} className="block">
                      <h3 className="product-card-title">"{product.name}"</h3>
                      <div className="flex items-baseline">
                        <span className="product-card-price">{product.price}</span>
                        {product.originalPrice && (
                          <span className="product-card-original-price">{product.originalPrice}</span>
                        )}
                      </div>
                      {product.colors && (
                        <div className="text-[10px] text-[var(--subtle-text-color)] mt-0.5">{product.colors} Colors</div>
                      )}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {viewAllLink && (
            <div className="mt-6 text-center sm:hidden">
              <Link href={viewAllLink} className="button-secondary !py-2 !px-4 !text-[10px]">
                VIEW ALL {title}
              </Link>
            </div>
          )}
        </div>
      </section>

      <ProductQuickView product={quickViewProduct} isOpen={isQuickViewOpen} onClose={closeQuickView} />
    </>
  )
}
