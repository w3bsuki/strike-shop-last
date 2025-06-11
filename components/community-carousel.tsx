"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Heart, MessageCircle } from "lucide-react"

type CommunityPost = {
  id: string
  username: string
  userAvatar: string
  image: string
  product: string
  caption: string
  likes: number
  comments: number
  location?: string
}

export default function CommunityCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const communityPosts: CommunityPost[] = [
    {
      id: "1",
      username: "@streetstyle_maven",
      userAvatar: "/placeholder.svg?height=40&width=40",
      image: "/placeholder.svg?height=400&width=400",
      product: "STRIKE™ OVERSIZED HOODIE",
      caption: "Living for this oversized fit! Perfect for those cozy street vibes ✨ #StrikeStyle",
      likes: 1247,
      comments: 89,
      location: "New York, NY",
    },
    {
      id: "2",
      username: "@minimal_mode",
      userAvatar: "/placeholder.svg?height=40&width=40",
      image: "/placeholder.svg?height=400&width=400",
      product: "STRIKE™ CARGO PANTS",
      caption: "Monochrome perfection. These cargos are everything! 🖤 #MinimalVibes",
      likes: 892,
      comments: 45,
      location: "London, UK",
    },
    {
      id: "3",
      username: "@fashion_forward_",
      userAvatar: "/placeholder.svg?height=40&width=40",
      image: "/placeholder.svg?height=400&width=400",
      product: "STRIKE™ CHUNKY SNEAKERS",
      caption: "These sneakers are a statement piece! Can't stop wearing them 👟",
      likes: 2156,
      comments: 134,
      location: "Tokyo, JP",
    },
    {
      id: "4",
      username: "@urban_explorer",
      userAvatar: "/placeholder.svg?height=40&width=40",
      image: "/placeholder.svg?height=400&width=400",
      product: "STRIKE™ TECHNICAL JACKET",
      caption: "Ready for any adventure in this technical masterpiece 🌆 #UrbanExplorer",
      likes: 1543,
      comments: 67,
      location: "Berlin, DE",
    },
    {
      id: "5",
      username: "@style_curator",
      userAvatar: "/placeholder.svg?height=40&width=40",
      image: "/placeholder.svg?height=400&width=400",
      product: "STRIKE™ CROSSBODY BAG",
      caption: "This bag completes every look. Luxury meets functionality 👜 #StrikeLuxury",
      likes: 967,
      comments: 52,
      location: "Paris, FR",
    },
    {
      id: "6",
      username: "@next_gen_style",
      userAvatar: "/placeholder.svg?height=40&width=40",
      image: "/placeholder.svg?height=400&width=400",
      product: "STRIKE™ GRAPHIC TEE",
      caption: "Expressing my creativity through fashion! This tee speaks volumes 🎨",
      likes: 1834,
      comments: 98,
      location: "Los Angeles, CA",
    },
  ]

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
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
      setTimeout(checkScrollability, 350)
    }
  }

  return (
    <section className="section-padding bg-gray-50">
      <div className="strike-container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="section-title">"COMMUNITY STYLE"</h2>
            <p className="text-xs text-[var(--subtle-text-color)] uppercase tracking-wider">
              Real customers, real style. Tag us @strike for a chance to be featured
            </p>
          </div>
          <div className="hidden md:flex space-x-2">
            {canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="p-2 border border-subtle hover:border-black transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="p-2 border border-subtle hover:border-black transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-1 horizontal-scroll"
          onScroll={checkScrollability}
        >
          {communityPosts.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white border border-subtle overflow-hidden"
            >
              {/* Post Header */}
              <div className="flex items-center p-3 border-b border-subtle">
                <Image
                  src={post.userAvatar || "/placeholder.svg"}
                  alt={post.username}
                  width={32}
                  height={32}
                  className="rounded-full mr-3"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold">{post.username}</p>
                  {post.location && <p className="text-[10px] text-[var(--subtle-text-color)]">{post.location}</p>}
                </div>
              </div>

              {/* Post Image */}
              <div className="relative aspect-square">
                <Image src={post.image || "/placeholder.svg"} alt={post.caption} fill className="object-cover" />
              </div>

              {/* Post Actions */}
              <div className="p-3">
                <div className="flex items-center space-x-4 mb-2">
                  <button className="flex items-center space-x-1 text-[var(--subtle-text-color)] hover:text-black">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">{post.likes.toLocaleString()}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-[var(--subtle-text-color)] hover:text-black">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{post.comments}</span>
                  </button>
                </div>

                {/* Product Tag */}
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-[var(--subtle-text-color)]">
                  Wearing: {post.product}
                </p>

                {/* Caption */}
                <p className="text-xs text-gray-700 leading-relaxed">{post.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
