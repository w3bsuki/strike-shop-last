"use client";

import * as React from "react";
import { ProductSection } from "../product/product-section";
import { ProductHeader } from "../product/product-header";
import { ProductScroll } from "../product/product-scroll";
import { cn } from "@/lib/utils";

interface CommunityPost {
  id: string;
  username: string;
  userAvatar?: string;
  images: string[];
  caption: string;
  likes: number;
  comments: number;
  location?: string;
}

interface CommunityReview {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  rating: number;
  date: string;
  product?: {
    name: string;
    href: string;
  };
}

interface CommunityShowcaseProps {
  title?: string;
  description?: string;
  viewAllLink?: string;
  viewAllText?: string;
  activeTab?: "instagram" | "reviews";
  onTabChange?: (tab: "instagram" | "reviews") => void;
  instagramPosts?: CommunityPost[];
  reviews?: CommunityReview[];
  className?: string;
  noSection?: boolean;
}

export function CommunityShowcase({
  title,
  description,
  viewAllLink,
  viewAllText = "VIEW ALL",
  activeTab = "instagram",
  onTabChange,
  instagramPosts = [],
  reviews = [],
  className,
  noSection = false,
}: CommunityShowcaseProps) {
  const [currentTab, setCurrentTab] = React.useState(activeTab);

  const handleTabChange = (tab: "instagram" | "reviews") => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  // Tab buttons component - mobile optimized
  const tabButtons = (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-md">
      <button
        onClick={() => handleTabChange('instagram')}
        className={cn(
          'px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-typewriter font-bold transition-all duration-200 rounded',
          currentTab === 'instagram'
            ? 'bg-black text-white'
            : 'text-black/60 hover:text-black'
        )}
      >
        FEED
      </button>
      <button
        onClick={() => handleTabChange('reviews')}
        className={cn(
          'px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-typewriter font-bold transition-all duration-200 rounded',
          currentTab === 'reviews'
            ? 'bg-black text-white'
            : 'text-black/60 hover:text-black'
        )}
      >
        REVIEWS
      </button>
    </div>
  );

  const content = (
    <>
      {/* Tab buttons - centered */}
      <div className="flex justify-center mb-6">
        {tabButtons}
      </div>
      
      <ProductScroll showControls controlsPosition="outside">
        {currentTab === 'instagram' ? (
          instagramPosts.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-[45vw] max-w-[200px] sm:w-48 md:w-56 lg:w-64 snap-start"
            >
              <div className="bg-background border border-border rounded-md overflow-hidden h-full">
                {/* Image */}
                <div className="aspect-square relative">
                  <img
                    src={post.images[0] || '/placeholder.svg'}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.userAvatar || '/placeholder.svg'}
                      alt={post.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <p className="text-xs font-typewriter font-semibold text-foreground">{post.username}</p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {post.caption.length > 60 ? post.caption.substring(0, 60) + '...' : post.caption}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>❤️ {post.likes > 999 ? `${Math.floor(post.likes/1000)}k` : post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[45vw] max-w-[200px] sm:w-48 md:w-56 lg:w-64 snap-start"
            >
              <div className="bg-background border border-border rounded-md p-3 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={review.author.avatar || '/placeholder.svg'}
                    alt={review.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <p className="text-xs font-typewriter font-semibold text-foreground">{review.author.name}</p>
                  {review.author.verified && <span className="text-xs">✓</span>}
                </div>
                
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-4 mb-2">{review.content}</p>
                
                {review.product && (
                  <p className="text-xs font-typewriter font-medium text-foreground">{review.product.name}</p>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
              </div>
            </div>
          ))
        )}
      </ProductScroll>
    </>
  );

  if (noSection) {
    return <div className={className}>{content}</div>;
  }

  return (
    <ProductSection size="default" background="none" className={className}>
      <ProductHeader
        title={title}
        {...(description && { description })}
        viewAllText={viewAllText}
        {...(viewAllLink && { viewAllHref: viewAllLink })}
        align="center"
        badge={tabButtons}
      />
      
      {content}
    </ProductSection>
  );
}