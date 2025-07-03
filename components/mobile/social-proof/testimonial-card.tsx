'use client';

import Image from 'next/image';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  author: {
    name: string;
    avatar?: string;
    username?: string;
    verified?: boolean;
  };
  content: string;
  rating?: number;
  date?: string;
  product?: {
    name: string;
    href?: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function TestimonialCard({
  author,
  content,
  rating = 5,
  date,
  product,
  variant = 'default',
  className,
}: TestimonialCardProps) {
  const baseStyles = cn(
    'bg-white border border-subtle overflow-hidden',
    'transition-all duration-200 hover:shadow-md',
    variant === 'featured' && 'border-2 border-black'
  );

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          'h-3 w-3',
          i < rating ? 'fill-black text-black' : 'fill-gray-200 text-gray-200'
        )}
      />
    ));
  };

  return (
    <article
      className={cn(baseStyles, className)}
      aria-label={`Testimonial from ${author.name}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-subtle">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {author.avatar && (
              <Image
                src={author.avatar}
                alt={author.name}
                width={variant === 'compact' ? 32 : 40}
                height={variant === 'compact' ? 32 : 40}
                className="rounded-full"
              />
            )}
            <div>
              <h3 className="text-sm font-bold">{author.name}</h3>
              {author.username && (
                <p className="text-xs text-gray-600">{author.username}</p>
              )}
            </div>
          </div>
          {variant === 'featured' && (
            <Quote className="h-5 w-5 text-gray-300" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center space-x-1 mb-3">
            {renderStars()}
            {date && (
              <span className="text-xs text-gray-500 ml-2">{date}</span>
            )}
          </div>
        )}

        {/* Review Text */}
        <p
          className={cn(
            'text-gray-700 leading-relaxed',
            variant === 'compact' ? 'text-xs' : 'text-sm',
            variant === 'featured' && 'text-base'
          )}
        >
          {variant === 'featured' && '"'}
          {content}
          {variant === 'featured' && '"'}
        </p>

        {/* Product */}
        {product && (
          <div className="mt-3 pt-3 border-t border-subtle">
            <p className="text-xs text-gray-600">
              Purchased:{' '}
              {product.href ? (
                <a
                  href={product.href}
                  className="font-medium text-black hover:underline"
                >
                  {product.name}
                </a>
              ) : (
                <span className="font-medium text-black">{product.name}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Verified Badge */}
      {author.verified && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center text-xs text-success font-medium">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified Purchase
          </span>
        </div>
      )}
    </article>
  );
}