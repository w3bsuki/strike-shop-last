'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { InstagramFeed } from './instagram-feed';
import { ReviewCarousel } from './review-carousel';
import { TestimonialCard } from './testimonial-card';
import { SectionHeader } from '@/components/ui/section-header';

interface SocialProofSectionProps {
  variant?: 'instagram' | 'reviews' | 'testimonials' | 'mixed';
  title?: string;
  subtitle?: string;
  data?: {
    instagramPosts?: any[];
    reviews?: any[];
    testimonials?: any[];
  };
  className?: string;
  showCta?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

export function SocialProofSection({
  variant = 'mixed',
  title = 'Join Our Community',
  subtitle = 'See what our customers are saying',
  data = {},
  className,
  showCta = true,
  ctaText = 'View All',
  ctaHref = '#',
}: SocialProofSectionProps) {
  const [activeTab, setActiveTab] = useState<'instagram' | 'reviews'>('instagram');

  // Sample data if none provided
  const defaultInstagramPosts = [
    {
      id: '1',
      username: '@streetstyle_maven',
      userAvatar: '/placeholder.svg?height=40&width=40',
      images: ['/placeholder.svg?height=400&width=400'],
      caption: 'Living for this oversized fit! Perfect for those cozy street vibes ✨ #StrikeStyle',
      likes: 1247,
      comments: 89,
      location: 'New York, NY',
      productTags: [
        { name: 'STRIKE™ HOODIE', x: 50, y: 60 }
      ],
    },
    // Add more posts...
  ];

  const defaultReviews = [
    {
      id: '1',
      author: {
        name: 'Sarah Johnson',
        username: '@sarahj',
        avatar: '/placeholder.svg?height=40&width=40',
        verified: true,
      },
      content: 'The quality is absolutely incredible. The oversized hoodie fits perfectly and the material feels premium. Will definitely be ordering more!',
      rating: 5,
      date: '2 days ago',
      product: {
        name: 'STRIKE™ OVERSIZED HOODIE',
        href: '/products/oversized-hoodie',
      },
      helpful: { yes: 24, no: 2 },
    },
    // Add more reviews...
  ];

  const instagramPosts = data.instagramPosts || defaultInstagramPosts;
  const reviews = data.reviews || defaultReviews;
  const testimonials = data.testimonials || reviews;

  if (variant === 'instagram') {
    return (
      <section className={cn('bg-background py-8 sm:py-12', className)}>
        <div className="strike-container">
          <SectionHeader
            title={title}
            showCta={showCta}
            ctaText={ctaText}
            ctaHref={ctaHref}
            className="mb-6 sm:mb-8"
          />
          <InstagramFeed posts={instagramPosts} variant="carousel" />
        </div>
      </section>
    );
  }

  if (variant === 'reviews') {
    return (
      <section className={cn('bg-background py-8 sm:py-12', className)}>
        <div className="strike-container">
          <ReviewCarousel
            reviews={reviews}
            title={title}
            subtitle={subtitle}
          />
        </div>
      </section>
    );
  }

  if (variant === 'testimonials') {
    return (
      <section className={cn('bg-background py-8 sm:py-12', className)}>
        <div className="strike-container">
          <SectionHeader
            title={title}
            showCta={showCta}
            ctaText={ctaText}
            ctaHref={ctaHref}
            className="mb-6 sm:mb-8"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                author={testimonial.author}
                content={testimonial.content}
                rating={testimonial.rating}
                date={testimonial.date}
                product={testimonial.product}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Mixed variant with tabs - FIXED LAYOUT
  return (
    <section className={cn('bg-background py-6 sm:py-8', className)}>
      <div className="strike-container">
        {/* Header with proper button alignment */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-typewriter font-bold uppercase tracking-wider text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
          </div>
          
          {/* Tab buttons - RIGHT SIDE like products */}
          <div className="flex gap-1 p-1 bg-muted rounded-md">
            <button
              onClick={() => setActiveTab('instagram')}
              className={cn(
                'px-3 py-1.5 text-xs font-typewriter font-medium transition-all duration-200 rounded-sm',
                activeTab === 'instagram'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              FEED
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={cn(
                'px-3 py-1.5 text-xs font-typewriter font-medium transition-all duration-200 rounded-sm',
                activeTab === 'reviews'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              REVIEWS
            </button>
          </div>
        </div>

        {/* Content - Horizontal scroll like products */}
        <div className="-mx-4 sm:mx-0">
          {activeTab === 'instagram' ? (
            <div className="flex overflow-x-auto gap-3 px-4 sm:px-0 pb-2">
              {instagramPosts.slice(0, 6).map((post) => (
                <div key={post.id} className="flex-none w-44 sm:w-48">
                  <div className="bg-background border border-border rounded-md overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={post.images[0] || '/placeholder.svg'}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-typewriter font-semibold text-foreground mb-1">{post.username}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.caption.length > 40 ? post.caption.substring(0, 40) + '...' : post.caption}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {post.likes > 999 ? `${Math.floor(post.likes/1000)}k` : post.likes}</span>
                        <span>💬 {post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-3 px-4 sm:px-0 pb-2">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="flex-none w-44 sm:w-48">
                  <div className="bg-background border border-border rounded-md p-3 h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={review.author.avatar || '/placeholder.svg'}
                        alt={review.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <p className="text-xs font-typewriter font-semibold text-foreground">{review.author.name}</p>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">{review.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All Link */}
        {showCta && (
          <div className="text-center mt-4">
            <a
              href={ctaHref}
              className="text-xs font-typewriter font-medium uppercase tracking-wider text-foreground hover:text-muted-foreground transition-colors"
            >
              {ctaText} →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}