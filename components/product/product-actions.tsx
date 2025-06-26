"use client";

import * as React from "react";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsWishlisted, useWishlistActions } from "@/lib/stores";
import { useQuickView } from "@/contexts/QuickViewContext";
import { useAria } from "@/components/accessibility/aria-helpers";
import type { WishlistItem } from "@/lib/wishlist-store";

export interface ProductActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    slug: string;
  };
  layout?: "horizontal" | "vertical" | "overlay";
  showQuickView?: boolean;
  showWishlist?: boolean;
  showAddToCart?: boolean;
  size?: "sm" | "default" | "lg";
}

const ProductActions = React.forwardRef<HTMLDivElement, ProductActionsProps>(
  ({ 
    className, 
    product, 
    layout = "horizontal", 
    showQuickView = true, 
    showWishlist = true,
    showAddToCart = false,
    size = "default",
    ...props 
  }, ref) => {
    const isWishlisted = useIsWishlisted(product.id);
    const { addToWishlist, removeFromWishlist } = useWishlistActions();
    const { openQuickView } = useQuickView();
    const { announceToScreenReader } = useAria();

    const wishlistItem: WishlistItem = React.useMemo(() => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    }), [product]);

    const handleWishlistToggle = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (navigator.vibrate) {
        navigator.vibrate(isWishlisted ? 50 : [100, 50, 100]);
      }

      if (isWishlisted) {
        removeFromWishlist(product.id);
        announceToScreenReader(`${product.name} removed from wishlist`, 'polite');
      } else {
        addToWishlist(wishlistItem);
        announceToScreenReader(`${product.name} added to wishlist`, 'polite');
      }
    }, [isWishlisted, product, removeFromWishlist, addToWishlist, wishlistItem, announceToScreenReader]);

    const handleQuickView = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(product);
      announceToScreenReader(`Quick view opened for ${product.name}`, 'polite');
    }, [openQuickView, product, announceToScreenReader]);

    const handleAddToCart = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // TODO: Implement add to cart functionality
      announceToScreenReader(`${product.name} added to cart`, 'polite');
    }, [product, announceToScreenReader]);

    const buttonSize = size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon";
    const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

    const layoutClasses = {
      horizontal: "flex items-center gap-2",
      vertical: "flex flex-col gap-2",
      overlay: "absolute inset-2 flex items-end justify-between",
    };

    return (
      <div
        ref={ref}
        className={cn(layoutClasses[layout], className)}
        {...props}
      >
        {showQuickView && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={handleQuickView}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className={iconSize} />
          </Button>
        )}

        {showWishlist && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={handleWishlistToggle}
            className={cn(
              "bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm",
              isWishlisted && "text-red-500"
            )}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
          >
            <Heart 
              className={cn(
                iconSize,
                isWishlisted && "fill-current"
              )} 
            />
          </Button>
        )}

        {showAddToCart && (
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={handleAddToCart}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className={iconSize} />
          </Button>
        )}
      </div>
    );
  }
);
ProductActions.displayName = "ProductActions";

export { ProductActions };