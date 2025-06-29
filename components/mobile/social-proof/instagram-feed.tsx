'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface InstagramPost {
  id: string;
  username: string;
  userAvatar?: string;
  images: string[];
  caption: string;
  likes: number;
  comments: number;
  location?: string;
  productTags?: Array<{
    name: string;
    href?: string;
    x: number; // Position percentage
    y: number; // Position percentage
  }>;
  timestamp?: string;
}

interface InstagramFeedProps {
  posts: InstagramPost[];
  variant?: 'grid' | 'carousel' | 'story';
  className?: string;
  onPostClick?: (post: InstagramPost) => void;
}

export function InstagramFeed({
  posts,
  variant = 'grid',
  className,
  onPostClick,
}: InstagramFeedProps) {
  if (variant === 'grid') {
    return <InstagramGrid posts={posts} {...(className && { className })} {...(onPostClick && { onPostClick })} />;
  }

  if (variant === 'carousel') {
    return <InstagramCarousel posts={posts} {...(className && { className })} />;
  }

  return <InstagramStories posts={posts} {...(className && { className })} />;
}

// Grid Layout Component
function InstagramGrid({
  posts,
  className,
  onPostClick,
}: {
  posts: InstagramPost[];
  className?: string;
  onPostClick?: (post: InstagramPost) => void;
}) {
  return (
    <div className={cn('grid grid-cols-4 sm:grid-cols-6 gap-1', className)}>
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick?.(post)}
          className="relative aspect-square overflow-hidden group cursor-pointer"
        >
          <Image
            src={post.images[0] || '/placeholder.svg'}
            alt={post.caption}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <span className="flex items-center text-xs">
                <Heart className="h-3 w-3 mr-1 fill-white" />
                {post.likes > 999 ? `${Math.floor(post.likes/1000)}k` : post.likes}
              </span>
              <span className="flex items-center text-xs">
                <MessageCircle className="h-3 w-3 mr-1 fill-white" />
                {post.comments > 999 ? `${Math.floor(post.comments/1000)}k` : post.comments}
              </span>
            </div>
          </div>

          {/* Multiple Images Indicator */}
          {post.images.length > 1 && (
            <div className="absolute top-2 right-2">
              <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// Carousel Component
function InstagramCarousel({
  posts,
  className,
}: {
  posts: InstagramPost[];
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex overflow-x-auto overflow-y-visible gap-4 pb-1 horizontal-scroll',
        className
      )}
    >
      {posts.map((post) => (
        <InstagramPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// Individual Post Card
function InstagramPostCard({ post }: { post: InstagramPost }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showProductTags, setShowProductTags] = useState(false);
  const { triggerHaptic } = useHapticFeedback();
  
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentImageIndex < post.images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
        triggerHaptic('light');
      }
    },
    onSwipeRight: () => {
      if (currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
        triggerHaptic('light');
      }
    },
  });

  const handleDoubleTap = () => {
    triggerHaptic('success');
    // Add like animation here
  };

  return (
    <article className="flex-shrink-0 w-[180px] sm:w-[200px] bg-background border border-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Image
            src={post.userAvatar || '/placeholder.svg'}
            alt={post.username}
            width={24}
            height={24}
            className="rounded-full"
          />
          <div>
            <p className="text-xs font-typewriter font-semibold text-foreground">{post.username}</p>
            {post.location && (
              <p className="text-[10px] text-muted-foreground">{post.location}</p>
            )}
          </div>
        </div>
        <button className="p-1">
          <MoreHorizontal className="h-3 w-3" />
        </button>
      </div>

      {/* Image with swipe */}
      <div
        className="relative aspect-square cursor-pointer"
        {...swipeHandlers}
        onDoubleClick={handleDoubleTap}
        onClick={() => setShowProductTags(!showProductTags)}
      >
        <Image
          src={post.images[currentImageIndex] || '/placeholder.svg'}
          alt={post.caption}
          fill
          sizes="(max-width: 640px) 180px, 200px"
          className="object-cover"
        />

        {/* Image indicators */}
        {post.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
            {post.images.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-all duration-200',
                  index === currentImageIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}

        {/* Product Tags */}
        {showProductTags && post.productTags?.map((tag, index) => (
          <div
            key={index}
            className="absolute animate-pulse"
            style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-white rounded-full opacity-50" />
              <div className="relative bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {tag.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions - Compact */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <button className="hover:opacity-70 transition-opacity">
              <Heart className="h-4 w-4" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
          <button className="hover:opacity-70 transition-opacity">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        {/* Likes - Compact */}
        <p className="text-xs font-typewriter font-semibold mb-1 text-foreground">
          {post.likes.toLocaleString()} likes
        </p>

        {/* Caption - Truncated for mobile */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          <span className="font-typewriter font-semibold mr-1 text-foreground">{post.username}</span>
          {post.caption.length > 50 ? post.caption.substring(0, 50) + '...' : post.caption}
        </p>
      </div>
    </article>
  );
}

// Stories Component
function InstagramStories({
  posts,
  className,
}: {
  posts: InstagramPost[];
  className?: string;
}) {
  return (
    <div className={cn('flex space-x-4 overflow-x-auto pb-2', className)}>
      {posts.map((post) => (
        <button
          key={post.id}
          className="flex-shrink-0 flex flex-col items-center space-y-2"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 rounded-full p-[2px]">
              <div className="bg-white rounded-full p-[2px] h-full w-full" />
            </div>
            <Image
              src={post.userAvatar || '/placeholder.svg'}
              alt={post.username}
              width={64}
              height={64}
              className="rounded-full relative"
            />
          </div>
          <span className="text-xs truncate max-w-[64px]">
            {post.username.replace('@', '')}
          </span>
        </button>
      ))}
    </div>
  );
}