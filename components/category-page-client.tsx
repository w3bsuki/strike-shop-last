"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useMemo } from "react"
import { Heart, SlidersHorizontal, ChevronDown, Search, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useWishlistStore } from "@/lib/wishlist-store"
import { SizeGuideModal } from "./size-guide-modal"

interface Product {
  id: string
  name: string
  price: string
  originalPrice?: string
  discount?: string
  image: string
  isNew: boolean
  slug: string
  colors?: number
}

interface CategoryPageClientProps {
  categoryName: string
  initialProducts: Product[]
}

const AVAILABLE_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Gray", value: "#808080" },
  { name: "Navy", value: "#000080" },
  { name: "Brown", value: "#8B4513" },
  { name: "Beige", value: "#F5F5DC" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
]

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

export default function CategoryPageClient({ categoryName, initialProducts }: CategoryPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 500])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState("newest")

  const { wishlist, addToWishlist, removeFromWishlist } = useWishlistStore()

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Price filter
      const price = Number.parseFloat(product.price.replace("£", ""))
      if (price < priceRange[0] || price > priceRange[1]) {
        return false
      }

      // For demo purposes, we'll assume color and size filtering works
      // In a real app, products would have these attributes

      return true
    })
  }, [initialProducts, searchQuery, priceRange])

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    switch (sortBy) {
      case "price-low":
        return sorted.sort(
          (a, b) => Number.parseFloat(a.price.replace("£", "")) - Number.parseFloat(b.price.replace("£", "")),
        )
      case "price-high":
        return sorted.sort(
          (a, b) => Number.parseFloat(b.price.replace("£", "")) - Number.parseFloat(a.price.replace("£", "")),
        )
      case "newest":
        return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
      default:
        return sorted
    }
  }, [filteredProducts, sortBy])

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) => (prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]))
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedColors([])
    setSelectedSizes([])
    setPriceRange([0, 500])
    setInStockOnly(false)
  }

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) +
    (inStockOnly ? 1 : 0)

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium mb-2 font-['Typewriter']">SEARCH</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Typewriter'] text-xs"
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium mb-3 font-['Typewriter']">COLOR</label>
        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                selectedColors.includes(color.name)
                  ? "border-black ring-2 ring-offset-1 ring-black"
                  : "border-gray-300 hover:border-gray-500"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {selectedColors.includes(color.name) &&
                (color.value.toUpperCase() === "#FFFFFF" || color.value.toUpperCase() === "#F5F5DC") && (
                  <Check className="h-4 w-4 text-black" />
                )}
              {selectedColors.includes(color.name) &&
                !(color.value.toUpperCase() === "#FFFFFF" || color.value.toUpperCase() === "#F5F5DC") && (
                  <Check className="h-4 w-4 text-white" />
                )}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium font-['Typewriter']">SIZE</label>
          <SizeGuideModal>
            <button className="text-xs font-medium text-gray-500 hover:text-black underline underline-offset-2">
              Size Guide
            </button>
          </SizeGuideModal>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABLE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`py-2 px-3 text-xs border font-['Typewriter'] transition-all ${
                selectedSizes.includes(size)
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-3 font-['Typewriter']">
          PRICE: £{priceRange[0]} - £{priceRange[1]}
        </label>
        <Slider value={priceRange} onValueChange={setPriceRange} max={500} min={0} step={10} className="w-full" />
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox id="in-stock" checked={inStockOnly} onCheckedChange={(checked) => setInStockOnly(checked === true)} />
        <label htmlFor="in-stock" className="text-sm font-medium font-['Typewriter']">
          IN STOCK ONLY
        </label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full font-['Typewriter'] text-xs">
          CLEAR ALL FILTERS ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

  return (
    <div className="section-padding">
      <div className="strike-container">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-4 border-b border-subtle">
          <h1 className="text-lg font-bold uppercase tracking-wider mb-4 lg:mb-0 font-['Typewriter']">
            {categoryName}{" "}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({sortedProducts.length} items)
            </span>
          </h1>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="strike-text" className="!border !border-border !py-1.5 !px-3">
                  SORT BY <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-['Typewriter'] text-xs">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-low")}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-high")}>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popularity")}>Popularity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="strike-text" className="!border !border-border !py-1.5 !px-3 lg:hidden">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                  FILTERS {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-['Typewriter'] text-left">FILTERS</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 font-['Typewriter']">FILTERS</h2>
              <FilterContent />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {sortedProducts.map((product) => {
                // Safe check for wishlist - provide fallback if wishlist is undefined
                const isInWishlist = wishlist?.some((item) => item.id === product.id) || false

                return (
                  <Link href={`/product/${product.slug}`} key={product.id} className="product-card">
                    <div className="product-card-image-wrapper">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={300}
                        height={400}
                        className="product-card-image"
                      />
                      {product.discount && <div className="product-card-discount">{product.discount}</div>}
                      {product.isNew && !product.discount && <div className="product-card-new">NEW</div>}
                      <button
                        className={`product-card-wishlist ${isInWishlist ? "text-red-500 bg-red-500/10" : "text-black"}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Safe check before calling wishlist functions
                          if (addToWishlist && removeFromWishlist) {
                            if (isInWishlist) {
                              removeFromWishlist(product.id)
                            } else {
                              addToWishlist({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                slug: product.slug,
                              })
                            }
                          }
                        }}
                        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 transition-colors ${isInWishlist ? "fill-red-500 text-red-500" : "text-black"}`}
                        />
                      </button>
                    </div>
                    <div className="product-card-content">
                      <h3 className="product-card-title">"{product.name}"</h3>
                      <div className="flex items-baseline">
                        <span className="product-card-price">{product.price}</span>
                        {product.originalPrice && (
                          <span className="product-card-original-price">{product.originalPrice}</span>
                        )}
                      </div>
                      {product.colors && product.colors > 1 && (
                        <div className="text-[10px] text-[var(--subtle-text-color)] mt-0.5">
                          {product.colors} Colors
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-medium mb-2 font-['Typewriter']">No products found</p>
                <p className="text-sm text-[var(--subtle-text-color)] mb-4 font-['Typewriter']">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters} variant="outline" className="font-['Typewriter']">
                  Clear All Filters
                </Button>
              </div>
            )}

            {sortedProducts.length > 0 && (
              <div className="flex justify-center mt-10">
                <Button className="button-secondary">LOAD MORE</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
