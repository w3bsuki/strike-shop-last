// Server-side product utilities - CVE-2025-29927 Compliant
import type { SimpleProduct } from '@/components/product/types';
import type { IntegratedProduct } from '@/types/integrated';

/**
 * Type guard to check if product is in integrated format
 */
function isIntegratedProduct(product: SimpleProduct | IntegratedProduct): product is IntegratedProduct {
  return 'content' in product && 'pricing' in product && 'badges' in product;
}

/**
 * Normalize product data from different formats into a simple format
 * Server-side utility function (no client hooks needed)
 */
export function normalizeProduct(product: SimpleProduct | IntegratedProduct): SimpleProduct {
  if (!isIntegratedProduct(product)) {
    return product;
  }

  const { content, pricing, badges } = product;
  const mainImage = content.images?.[0];
  
  return {
    id: product.id,
    name: content.name,
    price: pricing.displayPrice,
    image: typeof mainImage === 'string'
      ? mainImage
      : mainImage && 'asset' in mainImage && mainImage.asset && 'url' in mainImage.asset
        ? (mainImage.asset as any).url as string
        : mainImage && 'url' in mainImage
          ? (mainImage as any).url as string
          : '/placeholder.svg',
    slug: product.slug,
    ...(pricing.displaySalePrice && { originalPrice: pricing.displaySalePrice }),
    ...(badges.isSale && pricing.discount && { discount: `-${pricing.discount.percentage}%` }),
    ...(badges.isNew && { isNew: badges.isNew }),
    ...(badges.isSoldOut && { soldOut: badges.isSoldOut }),
    ...(content.categories?.length && { colors: content.categories.length })
  };
}

/**
 * Server-side accessibility feature generation
 * No client hooks needed - pure function
 */
export interface ProductAccessibility {
  productDescription: string;
  ariaIds: {
    title: string;
    description: string;
  };
}

export function generateProductAccessibility(product: SimpleProduct): ProductAccessibility {
  return {
    productDescription: [
      product.name,
      product.discount && `on sale with ${product.discount} discount`,
      product.isNew && 'new arrival',
      product.soldOut && 'currently sold out',
      product.originalPrice 
        ? `was ${product.originalPrice}, now ${product.price}`
        : `priced at ${product.price}`,
      product.colors && `available in ${product.colors} colors`,
    ].filter(Boolean).join(', '),
    ariaIds: {
      title: `product-title-${product.id}`,
      description: `product-description-${product.id}`,
    },
  };
}

export { isIntegratedProduct };