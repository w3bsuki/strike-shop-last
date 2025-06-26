"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/optimized-image";
import { ProductBadge } from "./product-badge";
import { ProductPrice } from "./product-price";
import { ProductActions } from "./product-actions";
import type { BaseProduct } from "./types";

interface ProductCardEnhancedProps {
  product: BaseProduct;
  className?: string;
  priority?: boolean;
  showActions?: boolean;
  actionsLayout?: "overlay" | "below";
  showBadges?: boolean;
  badgePosition?: "topLeft" | "topRight";
}

/**
 * Enhanced Product Card using modular components
 * This demonstrates how to compose the primitive components
 */
export const ProductCardEnhanced = React.memo(function ProductCardEnhanced({
  product,
  className,
  priority = false,
  showActions = true,
  actionsLayout = "overlay",
  showBadges = true,
  badgePosition = "topLeft",
}: ProductCardEnhancedProps) {
  const renderBadge = () => {
    if (!showBadges) return null;

    if (product.soldOut) {
      return <ProductBadge variant="soldOut" position={badgePosition}>SOLD OUT</ProductBadge>;
    }
    if (product.discount) {
      return <ProductBadge variant="sale" position={badgePosition}>{product.discount}</ProductBadge>;
    }
    if (product.isNew) {
      return <ProductBadge variant="new" position={badgePosition}>NEW</ProductBadge>;
    }
    return null;
  };

  return (
    <article
      className={cn(
        "product-card group transform transition-transform hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      <div className="relative overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="product-card-image"
            priority={priority}
            sizes="(max-width: 640px) 176px, (max-width: 768px) 192px, (max-width: 1024px) 208px, 240px"
          />
        </Link>

        {renderBadge()}

        {showActions && actionsLayout === "overlay" && (
          <ProductActions
            product={product}
            layout="overlay"
            showQuickView
            showWishlist
            size="default"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>

      <div className="product-card-content">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="product-card-title font-typewriter">{product.name}</h3>
          <ProductPrice
            price={product.price}
            originalPrice={product.originalPrice}
            size="default"
          />
          {product.colors && (
            <div className="text-[10px] text-[var(--subtle-text-color)] mt-0.5 font-typewriter">
              {product.colors} Colors
            </div>
          )}
        </Link>
      </div>

      {showActions && actionsLayout === "below" && (
        <ProductActions
          product={product}
          layout="horizontal"
          showQuickView
          showWishlist
          showAddToCart
          size="sm"
          className="mt-2"
        />
      )}
    </article>
  );
});