'use client';

/**
 * ProductCard Component - Now using compound component pattern internally
 * 
 * A performant, accessible product card component for e-commerce displays.
 * Features wishlist functionality, quick view, and proper accessibility.
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Split into focused compound components for better re-render optimization
 * - Extracted hooks for shared logic and memoization
 * - React.memo optimizations for individual component parts
 * - Maintained exact same API for backward compatibility
 * 
 * @component
 * @example
 * // Simple product format
 * <ProductCard
 *   product={{
 *     id: "123",
 *     name: "Product Name",
 *     price: "$99.99",
 *     image: "/product.jpg",
 *     slug: "product-slug"
 *   }}
 * />
 * 
 * @example
 * // Integrated product format
 * <ProductCard
 *   product={integratedProductObject}
 *   priority={true}
 * />
 * 
 * @example
 * // Using compound components directly for custom layouts
 * <Product.Root product={product}>
 *   <Product.Image />
 *   <Product.Badge />
 *   <Product.Actions rawProduct={product} />
 *   <Product.Link>
 *     <Product.Content />
 *   </Product.Link>
 * </Product.Root>
 */

// Re-export everything from the production implementation
export { ProductCard } from './production-card';
// export { Product } from './compound'; // Temporarily disabled for production build
export type { ProductCardProps, SimpleProduct } from './types';