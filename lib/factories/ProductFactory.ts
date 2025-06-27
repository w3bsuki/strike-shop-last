/**
 * ProductFactory - Factory Pattern Implementation
 * Creates standardized product objects from different data sources
 */

import type {
  IntegratedProduct,
  IntegratedVariant,
  IntegratedCartItem,
  IntegratedPrice,
} from '@/types/integrated';
import type { SanityProduct } from '@/types/sanity';
import type { MedusaProduct, MedusaProductVariant } from '@/types/medusa';
import type { CartItem } from '@/lib/cart-store';
import type { WishlistItem } from '@/lib/wishlist-store';
import { urlForImage } from '@/lib/sanity';
import { MedusaProductService } from '@/lib/medusa-service-refactored';

/**
 * Context for product creation with necessary data
 */
export interface ProductCreationContext {
  currency?: string;
  region?: string;
  includeVariants?: boolean;
  includePricing?: boolean;
  includeInventory?: boolean;
}

/**
 * Factory for creating integrated products from various data sources
 */
export class ProductFactory {
  private static readonly DEFAULT_CURRENCY = 'GBP';
  private static readonly DEFAULT_REGION = 'uk';

  /**
   * Create an IntegratedProduct from Medusa and optional Sanity data
   */
  static createIntegratedProduct(
    medusaProduct: MedusaProduct,
    sanityData?: SanityProduct | null,
    context: ProductCreationContext = {}
  ): IntegratedProduct {
    const {
      currency = this.DEFAULT_CURRENCY,
      region = this.DEFAULT_REGION,
      includeVariants = true,
      includePricing = true,
      includeInventory = true,
    } = context;

    // Extract core identifiers
    const id = medusaProduct.id;
    const sanityId = sanityData?._id;
    const slug = medusaProduct.handle || sanityData?.slug?.current || '';
    const sku = medusaProduct.variants?.[0]?.sku || undefined;

    // Create content section (prefer Sanity data)
    const content = this.createProductContent(medusaProduct, sanityData);

    // Create commerce section
    const commerce = this.createCommerceData(medusaProduct, {
      includeVariants,
      includeInventory,
      currency,
      region,
    });

    // Create pricing
    const pricing = includePricing
      ? this.createProductPricing(medusaProduct, currency)
      : this.createDefaultPricing(currency);

    // Create badges
    const badges = this.createProductBadges(medusaProduct, sanityData);

    // Create metadata
    const metadata = this.createProductMetadata(medusaProduct, sanityData);

    return {
      id,
      sanityId,
      slug,
      sku,
      content,
      commerce,
      pricing,
      badges,
      metadata,
    };
  }

  /**
   * Create an IntegratedProduct from Sanity data only
   */
  static createIntegratedProductFromSanity(
    sanityData: SanityProduct,
    context: ProductCreationContext = {}
  ): IntegratedProduct {
    const { currency = this.DEFAULT_CURRENCY, includeVariants = true } =
      context;

    const id = sanityData._id;
    const slug = sanityData.slug?.current || '';
    const sku = sanityData.sku;

    // Create content from Sanity
    const content = this.createProductContent(null, sanityData);

    // Create minimal commerce data
    const commerce = this.createCommerceDataFromSanity(sanityData, {
      includeVariants,
      currency,
    });

    // Create pricing from Sanity (with strategy if provided)
    const pricing = this.createProductPricingFromSanity(
      sanityData,
      currency,
      context.pricingStrategy,
      context.pricingContext
    );

    // Create badges
    const badges = this.createProductBadges(null, sanityData);

    // Create metadata
    const metadata = this.createProductMetadata(null, sanityData);

    return {
      id,
      sanityId: id,
      slug,
      sku,
      content,
      commerce,
      pricing,
      badges,
      metadata,
    };
  }

  /**
   * Create a cart item from product and variant data
   */
  static createCartItem(
    product: IntegratedProduct,
    variantId: string,
    quantity: number = 1
  ): IntegratedCartItem {
    // Find the variant
    const variant = product.commerce.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error(
        `Variant ${variantId} not found in product ${product.id}`
      );
    }

    // Get primary image
    const firstImage = product.content.images[0];
    const image = firstImage && 'url' in firstImage ? firstImage.url : '';

    // Extract size and color options
    const size = variant.options.size || 'One Size';
    const color = variant.options.color?.name;

    return {
      id: `${product.id}-${variantId}`,
      lineItemId: undefined, // Will be set when added to Medusa cart
      productId: product.id,
      variantId: variant.id,
      name: product.content.name,
      image,
      slug: product.slug,
      size,
      color,
      sku: variant.sku,
      pricing: {
        currency: variant.pricing.currency,
        unitPrice: variant.pricing.price,
        unitSalePrice: variant.pricing.salePrice,
        displayUnitPrice: variant.pricing.displayPrice,
        displayUnitSalePrice: variant.pricing.displaySalePrice,
        totalPrice: variant.pricing.price * quantity,
        displayTotalPrice: this.formatPrice(
          variant.pricing.price * quantity,
          variant.pricing.currency
        ),
      },
      quantity,
      maxQuantity: variant.inventory.quantity,
    };
  }

  /**
   * Create a wishlist item from product data
   */
  static createWishlistItem(product: IntegratedProduct): WishlistItem {
    return {
      id: product.id,
      name: product.content.name,
      slug: product.slug,
      image: product.content.images[0] && 'url' in product.content.images[0] ? product.content.images[0].url : '',
      price: product.pricing.displayPrice,
    };
  }

  /**
   * Create a legacy CartItem for backward compatibility
   */
  static createLegacyCartItem(
    integratedCartItem: IntegratedCartItem,
    lineItemId?: string
  ): CartItem {
    return {
      id: integratedCartItem.id,
      lineItemId: lineItemId || integratedCartItem.lineItemId || '',
      variantId: integratedCartItem.variantId,
      name: integratedCartItem.name,
      slug: integratedCartItem.slug,
      size: integratedCartItem.size,
      sku: integratedCartItem.sku,
      quantity: integratedCartItem.quantity,
      image: integratedCartItem.image,
      pricing: {
        unitPrice: integratedCartItem.pricing.unitPrice,
        unitSalePrice: integratedCartItem.pricing.unitSalePrice,
        totalPrice: integratedCartItem.pricing.totalPrice,
        displayUnitPrice: integratedCartItem.pricing.displayUnitPrice,
        displayUnitSalePrice: integratedCartItem.pricing.displayUnitSalePrice,
        displayTotalPrice: integratedCartItem.pricing.displayTotalPrice,
      },
    };
  }

  // Private helper methods

  /**
   * Create product content section
   */
  private static createProductContent(
    medusaProduct: MedusaProduct | null,
    sanityData: SanityProduct | null | undefined
  ) {
    const name = sanityData?.name || medusaProduct?.title || 'Untitled Product';
    const description =
      sanityData?.description || medusaProduct?.description || '';

    // Use Sanity images if available, fallback to Medusa
    const images = sanityData?.images?.length
      ? sanityData.images.map((img) => ({
          url: urlForImage(img).url(),
          alt: name,
          width: 800,
          height: 800,
        }))
      : medusaProduct?.images?.map((img) => ({
          url: img.url,
          alt: name,
          width: 800,
          height: 800,
        })) || [];

    return {
      name,
      description,
      details: sanityData?.details || [],
      images,
      categories: sanityData?.categories || [],
      tags: [
        ...(sanityData?.tags || []),
        ...(medusaProduct?.tags?.map((t) => t.value) || []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      brand: sanityData?.brand,
      material: sanityData?.material,
      care: sanityData?.care || [],
      features: sanityData?.features || [],
      story: sanityData?.story || [],
      sizeGuide: sanityData?.sizeGuide,
      sustainability: sanityData?.sustainability,
    };
  }

  /**
   * Create commerce data section
   */
  private static createCommerceData(
    medusaProduct: MedusaProduct,
    options: {
      includeVariants: boolean;
      includeInventory: boolean;
      currency: string;
      region: string;
    }
  ) {
    // Create variants
    const variants: IntegratedVariant[] = options.includeVariants
      ? medusaProduct.variants?.map((variant) =>
          this.createIntegratedVariant(variant, options.currency)
        ) || []
      : [];

    // Calculate overall inventory
    const inventory = {
      available: variants.some((v) => v.inventory.available),
      quantity: variants.reduce(
        (sum, v) => sum + (v.inventory.quantity || 0),
        0
      ),
    };

    // Extract prices
    const prices: IntegratedPrice[] =
      medusaProduct.variants?.flatMap(
        (variant) =>
          variant.prices?.map((price) => ({
            id: price.id,
            currencyCode: price.currency_code,
            amount: price.amount,
            saleAmount: undefined, // TODO: Implement sale pricing
            regionId: price.region_id || undefined,
            minQuantity: price.min_quantity || undefined,
            maxQuantity: price.max_quantity || undefined,
            includesTax: undefined, // Not available in Medusa price data
          })) || []
      ) || [];

    return {
      medusaProduct,
      variants,
      prices,
      inventory,
      tax: undefined, // TODO: Implement tax calculation
    };
  }

  /**
   * Create commerce data from Sanity only
   */
  private static createCommerceDataFromSanity(
    sanityData: SanityProduct,
    options: { includeVariants: boolean; currency: string }
  ) {
    // Create variants from Sanity
    const variants: IntegratedVariant[] = (
      options.includeVariants && sanityData.variants
        ? sanityData.variants.map((variant) => ({
            id: variant._key,
            title: variant.name,
            sku: variant.sku,
            options: {
              size: variant.size,
              color: variant.color ? { name: variant.color } : undefined,
            },
            prices: [
              {
                id: `${variant._key}-price`,
                currencyCode: options.currency,
                amount: (variant as any).price * 100 || 0,
                saleAmount: (variant as any).salePrice
                  ? (variant as any).salePrice * 100
                  : undefined,
              },
            ],
            pricing: {
              currency: options.currency,
              price: (variant as any).price * 100 || 0, // Fallback for missing price
              salePrice: (variant as any).salePrice
                ? (variant as any).salePrice * 100
                : undefined,
              displayPrice: this.formatPrice(
                (variant as any).price * 100 || 0,
                options.currency
              ),
              displaySalePrice: (variant as any).salePrice
                ? this.formatPrice(
                    (variant as any).salePrice * 100,
                    options.currency
                  )
                : undefined,
            },
            inventory: {
              available: variant.stock ? variant.stock > 0 : true,
              quantity: variant.stock || 0,
              allowBackorder: false,
            },
          }))
        : [
            {
              id: 'default',
              title: 'Default',
              sku: sanityData.sku,
              options: {},
              prices: [
                {
                  id: 'default-price',
                  currencyCode: options.currency,
                  amount: (sanityData as any).price * 100 || 0,
                  saleAmount: (sanityData as any).compareAtPrice
                    ? (sanityData as any).compareAtPrice * 100
                    : undefined,
                },
              ],
              pricing: {
                currency: options.currency,
                price: (sanityData as any).price * 100 || 0,
                salePrice: (sanityData as any).compareAtPrice
                  ? (sanityData as any).compareAtPrice * 100
                  : undefined,
                displayPrice: this.formatPrice(
                  (sanityData as any).price * 100 || 0,
                  options.currency
                ),
                displaySalePrice: (sanityData as any).compareAtPrice
                  ? this.formatPrice(
                      (sanityData as any).compareAtPrice * 100,
                      options.currency
                    )
                  : undefined,
              },
              inventory: {
                available: (sanityData as any).inStock ?? true,
                quantity: (sanityData as any).inStock ? 99 : 0,
                allowBackorder: false,
              },
            },
          ]
    ) as IntegratedVariant[];

    const inventory = {
      available: variants.some((v) => v.inventory.available),
      quantity: variants.reduce(
        (sum, v) => sum + (v.inventory.quantity || 0),
        0
      ),
    };

    const prices: IntegratedPrice[] = variants.flatMap((v) => v.prices);

    return {
      medusaProduct: undefined,
      variants,
      prices,
      inventory,
      tax: undefined,
    };
  }

  /**
   * Create integrated variant from Medusa variant
   */
  private static createIntegratedVariant(
    medusaVariant: MedusaProductVariant,
    currency: string
  ): IntegratedVariant {
    // Extract options
    const options: Record<string, any> = {};
    medusaVariant.options?.forEach((option) => {
      if (option.option?.title && option.value) {
        options[option.option.title.toLowerCase()] = option.value;
      }
    });

    // Create prices
    const prices: IntegratedPrice[] =
      medusaVariant.prices?.map((price) => ({
        id: price.id,
        currencyCode: price.currency_code,
        amount: price.amount,
        regionId: price.region_id || undefined,
        minQuantity: price.min_quantity || undefined,
        maxQuantity: price.max_quantity || undefined,
        includesTax: undefined, // Not available in Medusa price data
      })) || [];

    // Find relevant price
    const relevantPrice = medusaVariant.prices?.find(
      (p) => p.currency_code === currency
    );
    const priceAmount = relevantPrice?.amount || 0;

    return {
      id: medusaVariant.id,
      title: medusaVariant.title,
      sku: medusaVariant.sku || undefined,
      options,
      prices,
      pricing: {
        currency,
        price: priceAmount,
        salePrice: undefined, // TODO: Implement sale pricing
        displayPrice: this.formatPrice(priceAmount, currency),
        displaySalePrice: undefined,
      },
      inventory: {
        available: (medusaVariant.inventory_quantity || 0) > 0,
        quantity: medusaVariant.inventory_quantity,
        allowBackorder: medusaVariant.allow_backorder,
      },
      medusaVariant,
    };
  }

  /**
   * Create product pricing
   */
  private static createProductPricing(
    medusaProduct: MedusaProduct,
    currency: string
  ) {
    const lowestPrice = MedusaProductService.getLowestPrice(medusaProduct);
    const basePrice = lowestPrice?.amount || 0;

    return {
      currency,
      basePrice,
      salePrice: undefined,
      displayPrice: this.formatPrice(basePrice, currency),
      displaySalePrice: undefined,
      discount: undefined,
    };
  }

  /**
   * Create product pricing from Sanity
   */
  private static createProductPricingFromSanity(
    sanityData: SanityProduct,
    currency: string
  ) {
    const basePrice = (sanityData.price || 0) * 100;
    const salePrice = sanityData.compareAtPrice
      ? sanityData.compareAtPrice * 100
      : undefined;

    return {
      currency,
      basePrice,
      salePrice,
      displayPrice: this.formatPrice(basePrice, currency),
      displaySalePrice: salePrice
        ? this.formatPrice(salePrice, currency)
        : undefined,
      discount: salePrice
        ? {
            amount: basePrice - salePrice,
            percentage: Math.round(
              ((basePrice - salePrice) / basePrice) * 100
            ),
          }
        : undefined,
    };
  }

  /**
   * Create default pricing structure
   */
  private static createDefaultPricing(currency: string) {
    return {
      currency,
      basePrice: 0,
      salePrice: undefined,
      displayPrice: this.formatPrice(0, currency),
      displaySalePrice: undefined,
      discount: undefined,
    };
  }

  /**
   * Create product badges
   */
  private static createProductBadges(
    medusaProduct: MedusaProduct | null,
    sanityData: SanityProduct | null | undefined
  ) {
    const now = new Date();
    const createdAt = new Date(
      medusaProduct?.created_at || sanityData?._createdAt || now
    );
    const isNew =
      now.getTime() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

    // Check if sold out
    const isSoldOut =
      medusaProduct?.variants?.every(
        (v) => (v.inventory_quantity || 0) === 0
      ) ?? !sanityData?.inStock;

    return {
      isNew,
      isSale: !!sanityData?.compareAtPrice,
      isLimited: false, // TODO: Implement limited edition logic
      isSoldOut,
    };
  }

  /**
   * Create product metadata
   */
  private static createProductMetadata(
    medusaProduct: MedusaProduct | null,
    sanityData: SanityProduct | null | undefined
  ) {
    return {
      title:
        sanityData?.seo?.metaTitle ||
        sanityData?.name ||
        medusaProduct?.title,
      description:
        sanityData?.seo?.metaDescription ||
        sanityData?.description ||
        medusaProduct?.description,
      keywords: sanityData?.tags || [],
    };
  }

  /**
   * Format price helper
   */
  private static formatPrice(amount: number, currency: string): string {
    if (currency === 'GBP') {
      return `£${(amount / 100).toFixed(2)}`;
    }
    if (currency === 'USD') {
      return `$${(amount / 100).toFixed(2)}`;
    }
    if (currency === 'EUR') {
      return `€${(amount / 100).toFixed(2)}`;
    }
    return `${currency} ${(amount / 100).toFixed(2)}`;
  }
}
