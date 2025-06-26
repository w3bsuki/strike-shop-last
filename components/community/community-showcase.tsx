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
  title: string;
  description?: string;
  viewAllLink?: string;
  viewAllText?: string;
  activeTab?: "instagram" | "reviews";
  onTabChange?: (tab: "instagram" | "reviews") => void;
  instagramPosts?: CommunityPost[];
  reviews?: CommunityReview[];
  className?: string;
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
}: CommunityShowcaseProps) {
  const [currentTab, setCurrentTab] = React.useState(activeTab);

  const handleTabChange = (tab: "instagram" | "reviews") => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  // Tab buttons component
  const tabButtons = (
    <div className="flex gap-1 p-1 bg-muted rounded-md">
      <button
        onClick={() => handleTabChange('instagram')}
        className={cn(
          'px-3 py-1.5 text-xs font-typewriter font-medium transition-all duration-200 rounded-sm',
          currentTab === 'instagram'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        FEED
      </button>
      <button
        onClick={() => handleTabChange('reviews')}
        className={cn(
          'px-3 py-1.5 text-xs font-typewriter font-medium transition-all duration-200 rounded-sm',
          currentTab === 'reviews'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        REVIEWS
      </button>
    </div>
  );

  return (
    <ProductSection spacing="default" background="none" className={className}>
      <ProductHeader
        title={title}
        description={description}
        viewAllText={viewAllText}
        viewAllHref={viewAllLink}
        align="left"
        badge={tabButtons}
      />
      
      <ProductScroll showControls controlsPosition="outside">
        {currentTab === 'instagram' ? (
          instagramPosts.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-44 sm:w-48 md:w-52 lg:w-60 snap-start touch-manipulation"
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
              className="flex-shrink-0 w-44 sm:w-48 md:w-52 lg:w-60 snap-start touch-manipulation"
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
    </ProductSection>
  );
}