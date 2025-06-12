"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import { Minus, Plus, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductScroll from "@/components/product-scroll"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import ProductReviews from "@/components/product-reviews"
import { urlFor, type SanityProduct } from "@/lib/sanity"
import { PortableText } from "@portabletext/react" // For rendering rich text
import { SizeGuideModal } from "@/components/size-guide-modal"
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store"

interface ProductPageProps {
  productData: SanityProduct | null
  slug: string
}

export default function ProductPageClient({ productData, slug }: ProductPageProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlistStore()
  const [isProductPageItemWishlisted, setIsProductPageItemWishlisted] = useState(false)

  useEffect(() => {
    if (productData && isInWishlist) {
      // Ensure isInWishlist is defined
      setIsProductPageItemWishlisted(isInWishlist(productData._id))
    }
  }, [productData, isInWishlist, wishlist]) // Add wishlist to dependency array

  if (!productData) {
    // Handle product not found, e.g., return notFound() from next/navigation
    return <div>Product not found</div>
  }

  // Map Sanity data to the structure your component expects
  const product = {
    id: productData._id,
    name: productData.name,
    price: `£${productData.price.toFixed(2)}`,
    originalPrice: productData.originalPrice ? `£${productData.originalPrice.toFixed(2)}` : undefined,
    discount:
      productData.originalPrice && productData.price < productData.originalPrice
        ? `-${Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)}%`
        : undefined,
    sku: productData.sku || "N/A",
    shortDescription: productData.shortDescription || "No description available.",
    details: productData.details?.map((d) => ({ title: d.title || "", content: d.content || "" })) || [],
    sizes: productData.sizes || [],
    images: productData.images?.map((img) => (img ? urlFor(img).url() : "/placeholder.svg?height=800&width=600")) || [
      "/placeholder.svg?height=800&width=600",
    ],
    // For PortableText description:
    portableTextDescription: productData.description,
  }

  const handleProductPageWishlistToggle = () => {
    if (!productData || !addToWishlist || !removeFromWishlist || !isInWishlist) return

    const wishlistItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      slug: slug,
    }
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(wishlistItem)
    }
    setIsProductPageItemWishlisted(!isProductPageItemWishlisted) // Update local state
  }

  const relatedProducts = [
    {
      id: "rp1",
      name: "GRAPHIC PRINT HOODIE",
      price: "£450",
      image: "/placeholder.svg?height=400&width=300",
      isNew: true,
      slug: "graphic-print-hoodie",
    },
    {
      id: "rp2",
      name: "TAILORED WOOL TROUSERS",
      price: "£520",
      image: "/placeholder.svg?height=400&width=300",
      slug: "tailored-wool-trousers",
    },
    {
      id: "rp3",
      name: "LEATHER ANKLE BOOTS",
      price: "£680",
      image: "/placeholder.svg?height=400&width=300",
      slug: "leather-ankle-boots",
    },
    {
      id: "rp4",
      name: "LOGO EMBROIDERED CAP",
      price: "£190",
      image: "/placeholder.svg?height=400&width=300",
      slug: "logo-embroidered-cap",
    },
  ]

  return (
    <main className="bg-white">
      <Header />
      <div className="section-padding">
        <div className="strike-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Product Images */}
            <div className="relative">
              <div className="sticky top-24">
                {" "}
                {/* Sticky image container */}
                <div className="relative aspect-[3/4] mb-3 border border-subtle">
                  <Image
                    src={product.images[currentImageIndex] || "/placeholder.svg"}
                    alt={`${product.name} - View ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      className={`relative aspect-square border ${currentImageIndex === index ? "border-black" : "border-subtle"}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="20vw"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="lg:pt-0">
              {" "}
              {/* Removed sticky from details, image is sticky now */}
              <div className="space-y-3 mb-6">
                {product.discount && (
                  <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {product.discount}
                  </span>
                )}
                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider">"{product.name}"</h1>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg md:text-xl font-bold">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-[var(--subtle-text-color)] line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--subtle-text-color)] font-mono">SKU: {product.sku}</p>
                <p className="text-sm text-gray-700 pt-2">{product.shortDescription}</p>
              </div>
              <div className="space-y-6 mb-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider font-['Typewriter']">"SIZE"</h3>
                    <SizeGuideModal>
                      <button className="text-[10px] underline hover:no-underline text-[var(--subtle-text-color)] font-['Typewriter']">
                        SIZE GUIDE
                      </button>
                    </SizeGuideModal>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {product.sizes?.map((size) => (
                      <button
                        key={size}
                        className={`border p-2.5 text-xs font-medium transition-colors rounded-none
                                    ${selectedSize === size ? "bg-black text-white border-black" : "border-subtle hover:border-black"}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2">"QUANTITY"</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      className="border border-subtle p-2 hover:border-black disabled:opacity-50"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                    <button
                      className="border border-subtle p-2 hover:border-black"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mb-8">
                <Button className="button-primary w-full !py-3" disabled={!selectedSize}>
                  {selectedSize ? "ADD TO BAG" : "SELECT A SIZE"}
                </Button>
                <Button onClick={handleProductPageWishlistToggle} className="button-secondary w-full !py-3 flex items-center justify-center">
                  <Heart className={`h-4 w-4 mr-2 transition-colors ${isProductPageItemWishlisted ? "fill-red-500 text-red-500" : "text-current"}`} />
                  {isProductPageItemWishlisted ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST"}
                </Button>
              </div>
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {product.details.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-subtle">
                    <AccordionTrigger className="py-3 text-xs font-bold uppercase tracking-wider hover:no-underline">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 text-xs text-gray-700 leading-relaxed">
                      {product.portableTextDescription ? (
                        <PortableText value={product.portableTextDescription} />
                      ) : (
                        <p>{product.details.find(d => d.title === "Description")?.content || "No detailed description."}</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={slug} />
      <ProductScroll title="YOU MAY ALSO LIKE" products={relatedProducts} />
      <Footer />
    </main>
  )
}
