"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Category = {
  id: string
  name: string
  count: number
  image: string
  slug: string
}

interface CategoryScrollProps {
  title: string
  categories: Category[]
}

export default function CategoryScroll({ title, categories }: CategoryScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1) // -1 for precision
    }
  }

  useEffect(() => {
    checkScrollability()
    window.addEventListener("resize", checkScrollability)
    return () => window.removeEventListener("resize", checkScrollability)
  }, [categories])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
      setTimeout(checkScrollability, 350) // Re-check after scroll animation
    }
  }

  return (
    <section className="section-padding">
      <div className="strike-container">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">"{title}"</h2>
          <div className="flex items-center space-x-2">
            <Link href="/categories" className="hidden sm:flex">
              <Button variant="strike-text" className="text-xs">
                SHOP ALL <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
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
          {categories.map((category) => (
            <Link
              href={`/${category.slug}`}
              key={category.id}
              className="category-card flex-shrink-0 w-[60vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw] max-w-[280px]" // Adjusted widths
            >
              <div className="relative">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  width={280}
                  height={280}
                  className="category-card-image"
                />
                <div className="category-card-overlay" />
                <div className="category-card-content">
                  <h3 className="category-card-title">"{category.name}"</h3>
                  <p className="category-card-count">{category.count} ITEMS</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link href="/categories" className="button-secondary !py-2 !px-4 !text-[10px]">
            SHOP ALL CATEGORIES
          </Link>
        </div>
      </div>
    </section>
  )
}
