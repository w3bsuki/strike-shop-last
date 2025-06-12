"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroBanner from "@/components/hero-banner"
import CategoryScroll from "@/components/category-scroll"
import ProductScroll from "@/components/product-scroll"
import BottomNav from "@/components/bottom-nav"
import CommunityCarousel from "@/components/community-carousel"
import { ProductQuickView } from "@/components/product-quick-view"

import type { HomePageProps, HomePageProduct } from "@/types/home-page"

export default function HomePageClient({ categories, newArrivals, saleItems, sneakers, kidsItems }: HomePageProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<HomePageProduct | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const openQuickView = (product: HomePageProduct) => {
    // Ensure all necessary fields for quick view are present or mocked
    const enhancedProduct = {
      ...product,
      images: product.images || [
        product.image,
        product.image.replace("300", "301"),
        product.image.replace("300", "302"),
      ],
      description:
        product.description ||
        `Premium ${product.name.toLowerCase()} crafted with attention to detail and modern design aesthetics. Features high-quality materials and contemporary styling.`,
      sizes: product.sizes || ["XS", "S", "M", "L", "XL"],
      sku: product.sku || `STR${product.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}${Math.floor(Math.random() * 1000)}`,
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

  return (
    <main className="bg-white">
      <Header />

      <HeroBanner
        image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&crop=center"
        title='"STRIKE SS25"'
        subtitle="DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE"
        buttonText="EXPLORE COLLECTION"
        buttonLink="/new"
        showBrandCarousel={true}
      />

      <CategoryScroll title="SHOP BY CATEGORY" categories={categories} />

      <section className="section-padding bg-gray-50">
        <div className="strike-container">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">"SS25 MEN'S SALE"</h2>
            <Link href="/sale/men">
              <Button variant="strike-text" className="text-xs">
                VIEW ALL <span className="ml-1">→</span>
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto horizontal-scroll pb-2">
            {saleItems.map((item) => (
              <div key={item.id} className="product-card group flex-shrink-0 w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5625rem)]">
                <div className="product-card-image-wrapper">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={300}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                  {item.discount && <div className="product-card-discount">{item.discount}</div>}

                  <button
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openQuickView(item)
                    }}
                    aria-label="Quick view"
                  >
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full transform scale-90 group-hover:scale-100 transition-transform pointer-events-none">
                      <Eye className="h-4 w-4 text-black" />
                    </div>
                  </button>

                  <button
                    className="product-card-wishlist"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    aria-label="Add to wishlist"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="product-card-content">
                  <Link href={`/product/${item.slug}`} className="block">
                    <h3 className="product-card-title">"{item.name}"</h3>
                    <div className="flex items-baseline">
                      <span className="product-card-price">{item.price}</span>
                      {item.originalPrice && <span className="product-card-original-price">{item.originalPrice}</span>}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductScroll title="NEW ARRIVALS" products={newArrivals} viewAllLink="/new" />

      <HeroBanner
        image="/placeholder.svg?height=800&width=1200"
        title="THIS SEASON'S SNEAKERS"
        buttonText="DISCOVER NOW"
        buttonLink="/footwear"
        textPosition="center-left"
        textAlign="text-left"
        smallTitle={true}
      />

      <ProductScroll title="FEATURED FOOTWEAR" products={sneakers} viewAllLink="/footwear" />

      <HeroBanner
        image="/placeholder.svg?height=800&width=1200"
        title='"STRIKE KIDSWEAR"'
        subtitle="LATEST STYLES FOR THE LITTLE ONES"
        buttonText="SHOP KIDS"
        buttonLink="/kids"
        textPosition="bottom-center"
        textAlign="text-center"
        smallTitle={true}
      />

      <ProductScroll title="KIDS SALE HIGHLIGHTS" products={kidsItems} viewAllLink="/kids/sale" />

      <CommunityCarousel />

      <Footer />
      <BottomNav />

      {/* Quick View Modal */}
      <ProductQuickView product={quickViewProduct} isOpen={isQuickViewOpen} onClose={closeQuickView} />
    </main>
  )
}
