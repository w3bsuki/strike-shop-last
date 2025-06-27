"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { categoryAspectRatios, type CategoryAspectRatio } from "@/config/categories";

/**
 * CategoryCard Component
 * 
 * A visually appealing category card with hover effects and flexible layouts.
 * Supports various aspect ratios, overlays, and content positioning options.
 * 
 * @component
 * @example
 * <CategoryCard
 *   name="Summer Collection"
 *   image="/summer.jpg"
 *   href="/categories/summer"
 *   count={42}
 *   aspectRatio="portrait"
 *   overlay="gradient"
 * />
 */

const categoryCardVariants = cva(
  "group relative block overflow-hidden bg-gray-100 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "hover:shadow-xl",
        minimal: "hover:opacity-90",
        elevated: "shadow-md hover:shadow-2xl hover:-translate-y-1",
        bordered: "border border-border hover:border-foreground",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "none",
    },
  }
);

export interface CategoryCardProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof categoryCardVariants> {
  name: string;
  image: string;
  href: string;
  count?: number;
  description?: string;
  aspectRatio?: CategoryAspectRatio;
  priority?: boolean;
  overlay?: "none" | "gradient" | "dark" | "light";
  contentPosition?: "top-left" | "top-center" | "center" | "bottom-left" | "bottom-center";
}

const overlayClasses = {
  none: "",
  gradient: "bg-gradient-to-t from-black/60 via-black/20 to-transparent",
  dark: "bg-black/40",
  light: "bg-white/40",
};

const contentPositionClasses = {
  "top-left": "top-0 left-0 p-4 md:p-6",
  "top-center": "top-0 left-0 right-0 p-4 md:p-6 text-center",
  "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center",
  "bottom-left": "bottom-0 left-0 p-4 md:p-6",
  "bottom-center": "bottom-0 left-0 right-0 p-4 md:p-6 text-center",
};

const CategoryCard = React.forwardRef<HTMLAnchorElement, CategoryCardProps>(
  (
    {
      className,
      name,
      image,
      href,
      count,
      description,
      aspectRatio = "portrait",
      priority = false,
      variant,
      radius,
      overlay = "gradient",
      contentPosition = "bottom-left",
      ...props
    },
    ref
  ) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(categoryCardVariants({ variant, radius }), className)}
        aria-label={`${name}${count ? ` - ${count} items` : ""}`}
        {...props}
      >
        <div 
          className={cn("relative w-full bg-gray-100", categoryAspectRatios[aspectRatio])}
        >
          {/* Image */}
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            quality={85}
            loading={priority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL="data:image/webp;base64,UklGRpYAAABXRUJQVlA4IIoAAADQAwCdASoUAAsAPm0skkWkIqGYBABABsSxgFh2C1jbBVO6+A9PYAAA/vobXpT6gK1yOmyMB7w/dMU0WL9nzjFZKUKb/hW8B3UeJtjWDg/QhjAqvksfBN6ckcx/+adhyaiZAu2XRlfkbId/yT/6NSrU84HHTS69xIx9xmZWKyfVdAQ2zgT4/DbgAAA="
          />

          {/* Overlay */}
          {overlay !== "none" && (
            <div className={cn("absolute inset-0", overlayClasses[overlay])} />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Content */}
          <div className={cn("absolute z-10", contentPositionClasses[contentPosition])}>
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white uppercase tracking-tight">
              {name}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-white/80">{description}</p>
            )}
            {count !== undefined && (
              <p className="mt-2 text-sm text-white/70">
                {count} {count === 1 ? "Product" : "Products"}
              </p>
            )}
          </div>

          {/* Border Effect */}
          <div className="absolute inset-0 border border-white/0 transition-colors duration-300 group-hover:border-white/20" />
        </div>
      </Link>
    );
  }
);
CategoryCard.displayName = "CategoryCard";

export { CategoryCard, categoryCardVariants };