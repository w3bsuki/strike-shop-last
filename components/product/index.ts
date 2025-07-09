// Essential product components (5 core components)
export { ProductCard } from "./product-card";
export { ProductShowcase } from "./product-showcase";
export { EnhancedProductGallery as ProductGallery } from "./enhanced-product-gallery";
export { SizeSelector } from "./size-selector";
// Quick view is accessed via QuickViewModal component

// Supporting components (to be consolidated into ProductShowcase)
export { ProductSection } from "./product-section";
export { ProductHeader } from "./product-header";
export { ProductScroll } from "./product-scroll";

// Type exports
export type {
  BaseProduct,
  ProductVariant,
  ProductCardProps,
} from "./types";