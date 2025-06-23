/**
 * Refactored Product Card Component
 * Clean Architecture Implementation - UI Layer
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles product card presentation
 * - Open/Closed: Extensible through props, closed for modification
 * - Liskov Substitution: Can be substituted with any IProductCard implementation
 * - Interface Segregation: Uses specific interfaces for its needs
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Eye } from 'lucide-react';
import { ProductImage } from '@/components/ui/optimized-image';

// Clean Architecture Imports - Domain Layer
import type { ProductId, Money } from '@/shared/domain';

// Application Layer Interfaces
interface IProductCardData {
  readonly id: ProductId;
  readonly title: string;
  readonly handle: string;
  readonly featuredImage?: {
    readonly url: string;
    readonly alt: string;
  };
  readonly priceRange?: {
    readonly min: Money;
    readonly max: Money;
  };
  readonly isNew?: boolean;
  readonly isOnSale?: boolean;
  readonly isOutOfStock?: boolean;
  readonly variantCount?: number;
}

interface IWishlistActions {
  readonly isWishlisted: (productId: ProductId) => boolean;
  readonly addToWishlist: (productId: ProductId) => Promise<void>;
  readonly removeFromWishlist: (productId: ProductId) => Promise<void>;
}

interface IQuickViewActions {
  readonly openQuickView: (productId: ProductId) => Promise<void>;
}

interface IAnalyticsActions {
  readonly trackProductView: (productId: ProductId) => void;
  readonly trackWishlistToggle: (productId: ProductId, action: 'add' | 'remove') => void;
  readonly trackQuickView: (productId: ProductId) => void;
}

// Component Props Interface
interface ProductCardProps {
  readonly product: IProductCardData;
  readonly wishlistActions: IWishlistActions;
  readonly quickViewActions: IQuickViewActions;
  readonly analyticsActions?: IAnalyticsActions;
  readonly className?: string;
  readonly priority?: boolean;
  readonly showQuickView?: boolean;
  readonly showWishlist?: boolean;
  readonly size?: 'small' | 'medium' | 'large';
  readonly layout?: 'standard' | 'compact' | 'detailed';
}

// Product Card Badge Component (Single Responsibility)
interface ProductBadgeProps {
  readonly type: 'new' | 'sale' | 'out-of-stock';
  readonly label: string;
  readonly className?: string;
}

const ProductBadge = React.memo<ProductBadgeProps>(({ type, label, className = '' }) => {
  const badgeClasses = useMemo(() => {
    const baseClasses = 'absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded';
    const typeClasses = {
      'new': 'bg-green-600 text-white',
      'sale': 'bg-red-600 text-white',
      'out-of-stock': 'bg-gray-600 text-white',
    };
    return `${baseClasses} ${typeClasses[type]} ${className}`;
  }, [type, className]);

  return (
    <div className={badgeClasses}>
      {label}
    </div>
  );
});

ProductBadge.displayName = 'ProductBadge';

// Product Price Display Component (Single Responsibility)
interface ProductPriceProps {
  readonly priceRange?: {
    readonly min: Money;
    readonly max: Money;
  };
  readonly isOnSale?: boolean;
  readonly size?: 'small' | 'medium' | 'large';
}

const ProductPrice = React.memo<ProductPriceProps>(({ priceRange, isOnSale, size = 'medium' }) => {
  const priceClasses = useMemo(() => {
    const sizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };
    return `font-semibold ${sizeClasses[size]} ${isOnSale ? 'text-red-600' : 'text-gray-900'}`;
  }, [size, isOnSale]);

  if (!priceRange) {
    return <span className={priceClasses}>Price unavailable</span>;
  }

  const { min, max } = priceRange;
  const isSamePrice = min.equals(max);

  return (
    <div className="flex items-baseline space-x-1">
      <span className={priceClasses}>
        {isSamePrice ? min.format() : `${min.format()} - ${max.format()}`}
      </span>
      {isOnSale && (
        <span className="text-xs text-gray-500 line-through">
          {/* Original price would be shown here */}
        </span>
      )}
    </div>
  );
});

ProductPrice.displayName = 'ProductPrice';

// Action Button Component (Single Responsibility)
interface ActionButtonProps {
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly isActive?: boolean;
  readonly isLoading?: boolean;
  readonly className?: string;
  readonly size?: 'small' | 'medium' | 'large';
}

const ActionButton = React.memo<ActionButtonProps>(({
  onClick,
  icon,
  label,
  isActive = false,
  isLoading = false,
  className = '',
  size = 'medium'
}) => {
  const buttonClasses = useMemo(() => {
    const baseClasses = 'flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation';
    const sizeClasses = {
      small: 'h-8 w-8',
      medium: 'h-10 w-10',
      large: 'h-12 w-12',
    };
    const stateClasses = isActive ? 'text-red-500 shadow-sm' : 'text-black';
    const loadingClasses = isLoading ? 'opacity-50 cursor-not-allowed' : '';
    
    return `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${loadingClasses} ${className}`;
  }, [size, isActive, isLoading, className]);

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      disabled={isLoading}
    >
      {icon}
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

// Main Product Card Component
const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  wishlistActions,
  quickViewActions,
  analyticsActions,
  className = '',
  priority = false,
  showQuickView = true,
  showWishlist = true,
  size = 'medium',
  layout = 'standard'
}) => {
  // State Management
  const [isWishlistLoading, setIsWishlistLoading] = React.useState(false);
  const [isQuickViewLoading, setIsQuickViewLoading] = React.useState(false);

  // Derived State (Memoized for Performance)
  const isWishlisted = useMemo(() => 
    wishlistActions.isWishlisted(product.id), 
    [wishlistActions, product.id]
  );

  const imageSrc = useMemo(() => 
    product.featuredImage?.url || '/placeholder.svg', 
    [product.featuredImage?.url]
  );

  const imageAlt = useMemo(() => 
    product.featuredImage?.alt || product.title, 
    [product.featuredImage?.alt, product.title]
  );

  // Event Handlers (Memoized to Prevent Re-renders)
  const handleWishlistToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlistLoading) return;

    setIsWishlistLoading(true);

    try {
      // Haptic Feedback (Enhanced UX)
      if (navigator.vibrate) {
        if (isWishlisted) {
          navigator.vibrate(50); // Single vibration for remove
        } else {
          navigator.vibrate([100, 50, 100]); // Double vibration for add
        }
      }

      // Business Logic Execution
      if (isWishlisted) {
        await wishlistActions.removeFromWishlist(product.id);
        analyticsActions?.trackWishlistToggle(product.id, 'remove');
      } else {
        await wishlistActions.addToWishlist(product.id);
        analyticsActions?.trackWishlistToggle(product.id, 'add');
      }
    } catch (error) {
      console.error('Wishlist action failed:', error);
      // In a real app, show user-friendly error message
    } finally {
      setIsWishlistLoading(false);
    }
  }, [
    isWishlisted, 
    isWishlistLoading,
    product.id, 
    wishlistActions, 
    analyticsActions
  ]);

  const handleQuickView = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isQuickViewLoading) return;

    setIsQuickViewLoading(true);

    try {
      await quickViewActions.openQuickView(product.id);
      analyticsActions?.trackQuickView(product.id);
    } catch (error) {
      console.error('Quick view failed:', error);
      // In a real app, show user-friendly error message
    } finally {
      setIsQuickViewLoading(false);
    }
  }, [
    isQuickViewLoading,
    product.id, 
    quickViewActions, 
    analyticsActions
  ]);

  const handleProductClick = useCallback(() => {
    analyticsActions?.trackProductView(product.id);
  }, [product.id, analyticsActions]);

  // Dynamic Styling (Based on Props)
  const cardClasses = useMemo(() => {
    const baseClasses = 'product-card group transform transition-transform hover:scale-[1.02] active:scale-[0.98]';
    const sizeClasses = {
      small: 'max-w-xs',
      medium: 'max-w-sm',
      large: 'max-w-md',
    };
    const layoutClasses = {
      standard: 'space-y-2',
      compact: 'space-y-1',
      detailed: 'space-y-3',
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${layoutClasses[layout]} ${className}`;
  }, [size, layout, className]);

  // Badge Configuration
  const badges = useMemo(() => {
    const badgeList: Array<{ type: 'new' | 'sale' | 'out-of-stock'; label: string }> = [];
    
    if (product.isOutOfStock) {
      badgeList.push({ type: 'out-of-stock', label: 'SOLD OUT' });
    } else if (product.isOnSale) {
      badgeList.push({ type: 'sale', label: 'SALE' });
    } else if (product.isNew) {
      badgeList.push({ type: 'new', label: 'NEW' });
    }
    
    return badgeList;
  }, [product.isNew, product.isOnSale, product.isOutOfStock]);

  // Render Component
  return (
    <div className={cardClasses}>
      {/* Product Image Container */}
      <div className="product-card-image-wrapper relative">
        <ProductImage
          src={imageSrc}
          alt={imageAlt}
          className="product-card-image w-full h-auto"
          priority={priority}
        />

        {/* Product Badges */}
        {badges.map((badge, index) => (
          <ProductBadge
            key={badge.type}
            type={badge.type}
            label={badge.label}
            className={index > 0 ? 'top-10' : ''}
          />
        ))}

        {/* Action Buttons */}
        <div className="absolute inset-0 flex items-end justify-between p-2">
          {/* Quick View Button */}
          {showQuickView && (
            <ActionButton
              onClick={handleQuickView}
              icon={<Eye className="h-4 w-4" aria-hidden="true" />}
              label={`Quick view ${product.title}`}
              isLoading={isQuickViewLoading}
              className="lg:opacity-0 lg:group-hover:opacity-100"
              size={size === 'large' ? 'large' : 'medium'}
            />
          )}

          {/* Wishlist Button */}
          {showWishlist && (
            <ActionButton
              onClick={handleWishlistToggle}
              icon={
                <Heart
                  className={`h-4 w-4 transition-all duration-200 ${
                    isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-black hover:scale-110'
                  }`}
                  aria-hidden="true"
                />
              }
              label={isWishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
              isActive={isWishlisted}
              isLoading={isWishlistLoading}
              className="ml-auto"
              size={size === 'large' ? 'large' : 'medium'}
            />
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="product-card-content">
        <Link 
          href={`/product/${product.handle}`} 
          className="block space-y-1"
          onClick={handleProductClick}
        >
          {/* Product Title */}
          <h3 className="product-card-title font-medium text-gray-900 hover:text-gray-700 transition-colors">
            {product.title}
          </h3>

          {/* Product Price */}
          <ProductPrice
            priceRange={product.priceRange}
            isOnSale={product.isOnSale}
            size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
          />

          {/* Additional Information */}
          {layout === 'detailed' && product.variantCount && (
            <div className="text-xs text-gray-500">
              {product.variantCount} {product.variantCount === 1 ? 'Option' : 'Options'} Available
            </div>
          )}
        </Link>
      </div>
    </div>
  );
};

// Performance Optimization: Deep Memoization with Custom Comparison
export const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  // Only re-render if essential product data changes
  const productChanged = 
    !prevProps.product.id.equals(nextProps.product.id) ||
    prevProps.product.title !== nextProps.product.title ||
    prevProps.product.handle !== nextProps.product.handle ||
    prevProps.product.featuredImage?.url !== nextProps.product.featuredImage?.url ||
    prevProps.product.isNew !== nextProps.product.isNew ||
    prevProps.product.isOnSale !== nextProps.product.isOnSale ||
    prevProps.product.isOutOfStock !== nextProps.product.isOutOfStock;

  const propsChanged = 
    prevProps.priority !== nextProps.priority ||
    prevProps.className !== nextProps.className ||
    prevProps.size !== nextProps.size ||
    prevProps.layout !== nextProps.layout ||
    prevProps.showQuickView !== nextProps.showQuickView ||
    prevProps.showWishlist !== nextProps.showWishlist;

  // Price comparison (if both exist)
  const priceChanged = (() => {
    const prevPrice = prevProps.product.priceRange;
    const nextPrice = nextProps.product.priceRange;
    
    if (!prevPrice && !nextPrice) return false;
    if (!prevPrice || !nextPrice) return true;
    
    return !prevPrice.min.equals(nextPrice.min) || !prevPrice.max.equals(nextPrice.max);
  })();

  return !(productChanged || propsChanged || priceChanged);
});

ProductCard.displayName = 'ProductCard';

// Export Types for Other Components
export type {
  IProductCardData,
  IWishlistActions,
  IQuickViewActions,
  IAnalyticsActions,
  ProductCardProps,
};