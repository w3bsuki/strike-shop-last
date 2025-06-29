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
import {
  createProductId,
  createVariantId,
  createLineItemId,
  createSlug,
  createSKU,
  createImageURL,
  createPrice,
  createQuantity,
  createCurrencyCode,
  type LineItemId,
} from '@/types/branded';

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
    const id = createProductId(medusaProduct.id);
    const sanityId = sanityData?._id;
    const slug = createSlug(medusaProduct.handle || sanityData?.slug?.current || '');
    const sku = medusaProduct.variants?.[0]?.sku ? createSKU(medusaProduct.variants[0].sku) : undefined;

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
      ...( sanityId && { sanityId }),
      slug,
      ...(sku && { sku }),
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

    const id = createProductId(sanityData._id);
    const slug = createSlug(sanityData.slug?.current || '');
    const sku = (sanityData as any).sku ? createSKU((sanityData as any).sku) : undefined;

    // Create content from Sanity
    const content = this.createProductContent(null, sanityData);

    // Create minimal commerce data
    const commerce = this.createCommerceDataFromSanity(sanityData, {
      includeVariants,
      currency,
    });

    // Create pricing from Sanity
    const pricing = this.createProductPricingFromSanity(
      sanityData,
      currency
    );

    // Create badges
    const badges = this.createProductBadges(null, sanityData);

    // Create metadata
    const metadata = this.createProductMetadata(null, sanityData);

    return {
      id,
      sanityId: sanityData._id,
      slug,
      ...(sku && { sku }),
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
      id: createProductId(`${product.id}-${variantId}`),
      lineItemId: undefined as unknown as LineItemId, // Will be set when added to Medusa cart
      productId: product.id,
      variantId: createVariantId(variant.id),
      name: product.content.name,
      image: createImageURL(image),
      slug: product.slug,
      size,
      ...(color && { color }),
      ...(variant.sku && { sku: variant.sku }),
      pricing: {
        currency: variant.pricing.currency,
        unitPrice: variant.pricing.price,
        ...(variant.pricing.salePrice && { unitSalePrice: variant.pricing.salePrice }),
        displayUnitPrice: variant.pricing.displayPrice,
        ...(variant.pricing.displaySalePrice && { displayUnitSalePrice: variant.pricing.displaySalePrice }),
        totalPrice: createPrice(variant.pricing.price * quantity),
        displayTotalPrice: this.formatPrice(
          variant.pricing.price * quantity,
          variant.pricing.currency
        ),
      },
      quantity: createQuantity(quantity),
      ...(variant.inventory.quantity !== undefined && { maxQuantity: createQuantity(variant.inventory.quantity) }),
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
      lineItemId: createLineItemId(lineItemId || String(integratedCartItem.lineItemId) || ''),
      variantId: integratedCartItem.variantId,
      name: integratedCartItem.name,
      slug: integratedCartItem.slug,
      size: integratedCartItem.size,
      ...(integratedCartItem.sku && { sku: integratedCartItem.sku }),
      quantity: integratedCartItem.quantity,
      image: integratedCartItem.image,
      pricing: {
        unitPrice: integratedCartItem.pricing.unitPrice,
        ...(integratedCartItem.pricing.unitSalePrice && { unitSalePrice: integratedCartItem.pricing.unitSalePrice }),
        totalPrice: integratedCartItem.pricing.totalPrice,
        displayUnitPrice: integratedCartItem.pricing.displayUnitPrice,
        ...(integratedCartItem.pricing.displayUnitSalePrice && { displayUnitSalePrice: integratedCartItem.pricing.displayUnitSalePrice }),
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
          url: createImageURL(urlForImage(img).url()),
          alt: name,
          width: 800,
          height: 800,
        }))
      : medusaProduct?.images?.map((img) => ({
          url: createImageURL(img.url),
          alt: name,
          width: 800,
          height: 800,
        })) || [];

    return {
      name,
      ...(description && { description }),
      ...((sanityData as any)?.details && { details: (sanityData as any).details }),
      images,
      ...(sanityData?.categories?.length && { categories: sanityData.categories }),
      tags: [
        ...(sanityData?.tags || []),
        ...(medusaProduct?.tags?.map((t) => t.value) || []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      ...(sanityData?.brand && { brand: sanityData.brand }),
      ...(sanityData?.material && { material: sanityData.material }),
      ...(sanityData?.care?.length && { care: sanityData.care }),
      ...(sanityData?.features?.length && { features: sanityData.features }),
      ...(sanityData?.story?.length && { story: sanityData.story }),
      ...(sanityData?.sizeGuide && { sizeGuide: sanityData.sizeGuide }),
      ...(sanityData?.sustainability && { sustainability: sanityData.sustainability }),
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
      ...(options.includeInventory && {
        quantity: variants.reduce(
          (sum, v) => sum + (v.inventory.quantity || 0),
          0
        ),
      }),
    };

    // Extract prices
    const prices: IntegratedPrice[] =
      medusaProduct.variants?.flatMap(
        (variant) =>
          variant.prices?.map((price) => ({
            id: price.id,
            currencyCode: createCurrencyCode(price.currency_code),
            amount: createPrice(price.amount),
            // saleAmount omitted - TODO: Implement sale pricing
            ...(price.region_id && { regionId: price.region_id }),
            ...(price.min_quantity && { minQuantity: createQuantity(price.min_quantity) }),
            ...(price.max_quantity && { maxQuantity: createQuantity(price.max_quantity) }),
            // includesTax omitted - Not available in Medusa price data
          })) || []
      ) || [];

    return {
      medusaProduct,
      variants,
      prices,
      inventory,
      // tax property omitted - TODO: Implement tax calculation
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
      options.includeVariants && (sanityData as any).variants
        ? (sanityData as any).variants.map((variant: any) => ({
            id: createVariantId(variant._key),
            title: variant.name,
            ...(variant.sku && { sku: createSKU(variant.sku) }),
            options: {
              size: variant.size,
              ...(variant.color && { color: { name: variant.color } }),
            },
            prices: [
              {
                id: `${variant._key}-price`,
                currencyCode: options.currency,
                amount: (variant as any).price * 100 || 0,
                ...((variant as any).salePrice && {
                  saleAmount: (variant as any).salePrice * 100,
                }),
              },
            ],
            pricing: {
              currency: createCurrencyCode(options.currency),
              price: createPrice((variant as any).price * 100 || 0),
              ...((variant as any).salePrice && {
                salePrice: createPrice((variant as any).salePrice * 100),
              }),
              displayPrice: this.formatPrice(
                (variant as any).price * 100 || 0,
                options.currency
              ),
              ...((variant as any).salePrice && {
                displaySalePrice: this.formatPrice(
                  (variant as any).salePrice * 100,
                  options.currency
                ),
              }),
            },
            inventory: {
              available: variant.stock ? variant.stock > 0 : true,
              ...(variant.stock !== undefined && { quantity: variant.stock }),
              allowBackorder: false,
            },
          }))
        : [
            {
              id: createVariantId('default'),
              title: 'Default',
              ...((sanityData as any).sku && { sku: createSKU((sanityData as any).sku) }),
              options: {},
              prices: [
                {
                  id: 'default-price',
                  currencyCode: options.currency,
                  amount: (sanityData as any).price * 100 || 0,
                  ...((sanityData as any).compareAtPrice && {
                    saleAmount: (sanityData as any).compareAtPrice * 100,
                  }),
                },
              ],
              pricing: {
                currency: createCurrencyCode(options.currency),
                price: createPrice((sanityData as any).price * 100 || 0),
                ...((sanityData as any).compareAtPrice && {
                  salePrice: createPrice((sanityData as any).compareAtPrice * 100),
                }),
                displayPrice: this.formatPrice(
                  (sanityData as any).price * 100 || 0,
                  options.currency
                ),
                ...((sanityData as any).compareAtPrice && {
                  displaySalePrice: this.formatPrice(
                    (sanityData as any).compareAtPrice * 100,
                    options.currency
                  ),
                }),
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
      ...(options.includeVariants && {
        quantity: variants.reduce(
          (sum, v) => sum + (v.inventory.quantity || 0),
          0
        ),
      }),
    };

    const prices: IntegratedPrice[] = variants.flatMap((v) => v.prices);

    return {
      variants,
      prices,
      inventory,
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
        currencyCode: createCurrencyCode(price.currency_code),
        amount: createPrice(price.amount),
        ...(price.region_id && { regionId: price.region_id }),
        ...(price.min_quantity && { minQuantity: createQuantity(price.min_quantity) }),
        ...(price.max_quantity && { maxQuantity: createQuantity(price.max_quantity) }),
      })) || [];

    // Find relevant price
    const relevantPrice = medusaVariant.prices?.find(
      (p) => p.currency_code === currency
    );
    const priceAmount = relevantPrice?.amount || 0;

    return {
      id: createVariantId(medusaVariant.id),
      title: medusaVariant.title,
      ...(medusaVariant.sku && { sku: createSKU(medusaVariant.sku) }),
      options,
      prices,
      pricing: {
        currency: createCurrencyCode(currency),
        price: createPrice(priceAmount),
        displayPrice: this.formatPrice(priceAmount, currency),
      },
      inventory: {
        available: (medusaVariant.inventory_quantity || 0) > 0,
        ...(medusaVariant.inventory_quantity !== undefined && { quantity: createQuantity(medusaVariant.inventory_quantity) }),
        ...(medusaVariant.allow_backorder !== undefined && { allowBackorder: medusaVariant.allow_backorder }),
      },
      ...(medusaVariant && { medusaVariant }),
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
      currency: createCurrencyCode(currency),
      basePrice: createPrice(basePrice),
      displayPrice: this.formatPrice(basePrice, currency),
    };
  }

  /**
   * Create product pricing from Sanity
   */
  private static createProductPricingFromSanity(
    sanityData: SanityProduct,
    currency: string
  ) {
    const basePrice = ((sanityData as any).price || 0) * 100;
    const salePrice = (sanityData as any).compareAtPrice
      ? (sanityData as any).compareAtPrice * 100
      : undefined;

    return {
      currency: createCurrencyCode(currency),
      basePrice: createPrice(basePrice),
      ...(salePrice && { salePrice: createPrice(salePrice) }),
      displayPrice: this.formatPrice(basePrice, currency),
      ...(salePrice && {
        displaySalePrice: this.formatPrice(salePrice, currency),
      }),
      ...(salePrice && {
        discount: {
          amount: createPrice(basePrice - salePrice),
          percentage: Math.round(
            ((basePrice - salePrice) / basePrice) * 100
          ),
        },
      }),
    };
  }

  /**
   * Create default pricing structure
   */
  private static createDefaultPricing(currency: string) {
    return {
      currency: createCurrencyCode(currency),
      basePrice: createPrice(0),
      displayPrice: this.formatPrice(0, currency),
    };
  }

  /**
   * Create product badges
   */
  private static createProductBadges(
    medusaProduct: MedusaProduct | null,
    _sanityData: SanityProduct | null | undefined
  ) {
    const now = new Date();
    const createdAt = new Date(
      medusaProduct?.created_at || now
    );
    const isNew =
      now.getTime() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

    // Check if sold out
    const isSoldOut =
      medusaProduct?.variants?.every(
        (v) => (v.inventory_quantity || 0) === 0
      ) ?? false; // TODO: Implement stock check when Sanity has inStock field

    return {
      isNew,
      isSale: false, // TODO: Implement sale logic when Sanity has compareAtPrice
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
    const title = sanityData?.name || medusaProduct?.title;
    const description = sanityData?.description || medusaProduct?.description;
    const keywords = sanityData?.tags || [];
    
    return {
      ...(title && { title }),
      ...(description && { description }),
      ...(keywords.length > 0 && { keywords }),
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
