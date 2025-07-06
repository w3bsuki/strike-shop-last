import { shopifyClient } from './client';
import type { Product, Collection, ProductVariant } from './types';
import type { ShopifyRequestContext } from './client';
import type { Locale } from '@/lib/i18n/config';
import type { 
  IntegratedProduct, 
  IntegratedVariant, 
  IntegratedCollection
} from '@/types';
import { 
  createProductId, 
  createVariantId, 
  createPrice, 
  createQuantity, 
  createCurrencyCode,
  createSlug,
  createImageURL
} from '@/types';

// Utility function to create Shopify context from app locale
export function createShopifyContext(locale: Locale): ShopifyRequestContext {
  // Map app locales to Shopify language/country codes
  const localeToShopifyMap = {
    'bg': { language: 'BG', country: 'BG' },
    'en': { language: 'EN', country: 'GB' }, // Using GB as default for English
    'ua': { language: 'UK', country: 'UA' },  // UK is the ISO code for Ukrainian language
  } as const;

  const shopifyLocale = localeToShopifyMap[locale];
  
  if (!shopifyLocale) {
    console.warn(`Unknown locale: ${locale}, falling back to English`);
    return { language: 'EN', country: 'GB' };
  }

  console.log(`[ShopifyService] Creating context for locale ${locale}:`, shopifyLocale);
  return shopifyLocale;
}

// Test function to validate if Shopify localization is working
export async function testShopifyLocalization() {
  if (!shopifyClient) {
    console.error('[ShopifyTest] Client not initialized');
    return;
  }

  console.log('[ShopifyTest] Testing localization support...');
  
  try {
    // Test with Bulgarian context
    const bgContext = createShopifyContext('bg');
    const bgProducts = await shopifyClient.getProducts(2, bgContext);
    console.log('[ShopifyTest] BG Products:', bgProducts.map(p => ({ id: p.id, title: p.title })));

    // Test with English context
    const enContext = createShopifyContext('en');
    const enProducts = await shopifyClient.getProducts(2, enContext);
    console.log('[ShopifyTest] EN Products:', enProducts.map(p => ({ id: p.id, title: p.title })));

    // Test collections
    const bgCollections = await shopifyClient.getCollections(5, bgContext);
    console.log('[ShopifyTest] BG Collections:', bgCollections.map(c => ({ id: c.id, title: c.title })));

    const enCollections = await shopifyClient.getCollections(5, enContext);
    console.log('[ShopifyTest] EN Collections:', enCollections.map(c => ({ id: c.id, title: c.title })));

  } catch (error) {
    console.error('[ShopifyTest] Error:', error);
  }
}

// Transform Shopify product to our internal format
export function transformShopifyProduct(shopifyProduct: Product): IntegratedProduct {
  const variants = shopifyProduct.variants?.edges?.map(edge => 
    transformShopifyVariant(edge.node)
  ) || [];

  const prices = variants.flatMap(variant => variant.prices);
  const basePrice = prices[0]?.amount || createPrice(0);
  const currency = prices[0]?.currencyCode || createCurrencyCode('USD');

  // Check if any variant has a sale price
  const salePrice = variants.find(v => v.pricing.salePrice)?.pricing.salePrice;

  const product: IntegratedProduct = {
    id: createProductId(shopifyProduct.id),
    slug: createSlug(shopifyProduct.handle),
    
    content: {
      name: shopifyProduct.title,
      description: shopifyProduct.description,
      images: shopifyProduct.images?.edges?.map(edge => ({
        url: createImageURL(edge.node.url),
        alt: edge.node.altText || shopifyProduct.title,
        width: edge.node.width || 800,
        height: edge.node.height || 800,
      })) || [],
      tags: shopifyProduct.tags,
      brand: shopifyProduct.vendor,
    },

    commerce: {
      variants,
      prices,
      inventory: {
        available: variants.some(v => v.inventory.available),
        quantity: variants.reduce((sum, v) => sum + (v.inventory.quantity || 0), 0),
      },
    },

    pricing: {
      currency,
      basePrice,
      ...(salePrice && { salePrice }),
      displayPrice: formatPrice(basePrice, currency),
      ...(salePrice && { displaySalePrice: formatPrice(salePrice, currency) }),
      ...(salePrice && {
        discount: {
          amount: createPrice(basePrice - salePrice),
          percentage: Math.round(((basePrice - salePrice) / basePrice) * 100),
        }
      }),
    },

    badges: {
      isNew: isNewProduct(shopifyProduct),
      isSale: !!salePrice,
      isSoldOut: !variants.some(v => v.inventory.available),
    },

    metadata: {
      title: shopifyProduct.title,
      description: shopifyProduct.description,
      keywords: shopifyProduct.tags,
    },
  };

  return product;
}

// Transform Shopify variant to our internal format
export function transformShopifyVariant(shopifyVariant: ProductVariant): IntegratedVariant {
  const price = createPrice(parseFloat(shopifyVariant.price.amount));
  const salePrice = shopifyVariant.compareAtPrice 
    ? createPrice(parseFloat(shopifyVariant.compareAtPrice.amount))
    : undefined;
  const currency = createCurrencyCode(shopifyVariant.price.currencyCode);

  const variant = {
    id: createVariantId(shopifyVariant.id),
    title: shopifyVariant.title,
    
    options: shopifyVariant.selectedOptions.reduce((acc: Record<string, string | { name: string }>, option) => {
      if (option.name.toLowerCase() === 'size') {
        acc.size = option.value;
      } else if (option.name.toLowerCase() === 'color') {
        acc.color = { name: option.value };
      } else {
        acc[option.name.toLowerCase()] = option.value;
      }
      return acc;
    }, {}),

    prices: [{
      id: `${shopifyVariant.id}-price`,
      currencyCode: currency,
      amount: price,
      ...(salePrice && { saleAmount: salePrice }),
    }],

    pricing: {
      currency,
      price,
      ...(salePrice && { salePrice }),
      displayPrice: formatPrice(price, currency),
      ...(salePrice && { displaySalePrice: formatPrice(salePrice, currency) }),
    },

    inventory: {
      available: shopifyVariant.availableForSale,
      quantity: createQuantity(shopifyVariant.quantityAvailable || 0),
    },

    ...(shopifyVariant.image && {
      images: [{
        _type: 'image' as const,
        asset: {
          _ref: `image-${Date.now()}`,
          _type: 'reference' as const,
        },
        alt: shopifyVariant.image.altText || shopifyVariant.title,
        url: createImageURL(shopifyVariant.image.url),
        width: 800, // Default width, could be extracted from URL params
        height: 800, // Default height, could be extracted from URL params
      }]
    }),
  };

  return variant as IntegratedVariant;
}

// Transform Shopify collection to our internal format
export function transformShopifyCollection(shopifyCollection: Collection): IntegratedCollection {
  const collection = {
    id: shopifyCollection.id,
    name: shopifyCollection.title,
    slug: shopifyCollection.handle,
    description: shopifyCollection.description,
    ...(shopifyCollection.image && {
      image: {
        _type: 'image' as const,
        asset: {
          _ref: `collection-image-${Date.now()}`,
          _type: 'reference' as const,
        },
        alt: shopifyCollection.image.altText || shopifyCollection.title,
        url: createImageURL(shopifyCollection.image.url),
        width: 800,
        height: 600,
      }
    }),
    products: shopifyCollection.products?.edges?.map(edge => 
      transformShopifyProduct(edge.node)
    ) || [],
    metadata: {
      title: shopifyCollection.title,
      description: shopifyCollection.description,
    },
  };
  
  return collection as IntegratedCollection;
}

// Helper function to format prices
function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency as string,
  }).format(amount as number);
}

// Helper function to check if product is new (created within last 30 days)
function isNewProduct(product: Product): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(product.createdAt) > thirtyDaysAgo;
}

// Helper function to flatten IntegratedProduct for simpler use cases
function flattenProduct(product: IntegratedProduct) {
  // Get the main image URL as a string for ProductCard compatibility
  const mainImageUrl = product.content?.images?.[0]?.url || '/placeholder.svg?height=400&width=400';
  
  // Format price as string with currency symbol
  const price = product.pricing?.basePrice || 0;
  const formattedPrice = `€${price}`;
  
  return {
    id: product.id,
    name: product.content?.name || 'Unnamed Product',
    slug: product.slug,
    price: formattedPrice,
    originalPrice: product.pricing?.salePrice ? formattedPrice : undefined,
    salePrice: product.pricing?.salePrice ? `€${product.pricing.salePrice}` : undefined,
    image: mainImageUrl, // Simple string URL for ProductCard
    images: product.content?.images || [],
    availableForSale: !product.badges?.isSoldOut,
    soldOut: product.badges?.isSoldOut || false,
    isNew: false, // Could be enhanced with actual logic
    description: product.content?.description || '',
    variants: product.commerce?.variants || [],
    vendor: product.content?.brand,
    collections: product.content?.tags?.map(tag => ({ handle: tag })) || [],
    variantId: product.commerce?.variants?.[0]?.id || product.id // For cart operations
  };
}

// Service functions that can be called from components
export const ShopifyService = {
  // Search products
  async searchProducts(query: string, limit: number = 20, context?: ShopifyRequestContext): Promise<IntegratedProduct[]> {
    try {
      if (!shopifyClient) {
        console.warn('Shopify client not configured, returning empty results');
        return [];
      }

      const shopifyProducts = await shopifyClient.searchProducts(query, limit, context);
      return shopifyProducts.map(transformShopifyProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Get all products
  async getProducts(limit: number = 20, context?: ShopifyRequestContext): Promise<IntegratedProduct[]> {
    try {
      if (!shopifyClient) {
        console.warn('Shopify client not configured, returning empty results');
        return [];
      }

      console.log('[ShopifyService] Fetching products with limit:', limit, 'context:', context);
      const shopifyProducts = await shopifyClient.getProducts(limit, context);
      console.log('[ShopifyService] Raw Shopify products:', shopifyProducts);
      console.log('[ShopifyService] Number of products fetched:', shopifyProducts.length);
      
      const transformedProducts = shopifyProducts.map(transformShopifyProduct);
      console.log('[ShopifyService] Transformed products:', transformedProducts);
      
      return transformedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get flattened products (simpler structure for homepage)
  async getFlattenedProducts(limit: number = 20, context?: ShopifyRequestContext) {
    const products = await this.getProducts(limit, context);
    return products.map(flattenProduct);
  },

  // Get product by handle/slug
  async getProductBySlug(slug: string, context?: ShopifyRequestContext): Promise<IntegratedProduct | null> {
    try {
      if (!shopifyClient) return null;
      const shopifyProduct = await shopifyClient.getProductByHandle(slug, context);
      return shopifyProduct ? transformShopifyProduct(shopifyProduct) : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get all collections
  async getCollections(context?: ShopifyRequestContext): Promise<IntegratedCollection[]> {
    try {
      if (!shopifyClient) return [];
      const shopifyCollections = await shopifyClient.getCollections(20, context);
      return shopifyCollections.map(transformShopifyCollection);
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },

  // Get collection by handle
  async getCollectionBySlug(slug: string, context?: ShopifyRequestContext): Promise<IntegratedCollection | null> {
    try {
      if (!shopifyClient) return null;
      const shopifyCollection = await shopifyClient.getCollectionByHandle(slug, context);
      return shopifyCollection ? transformShopifyCollection(shopifyCollection) : null;
    } catch (error) {
      console.error('Error fetching collection:', error);
      return null;
    }
  },


  // Cart operations
  async createCart() {
    if (!shopifyClient) throw new Error('Shopify client not configured');
    return shopifyClient.createCart();
  },

  async addToCart(cartId: string, variantId: string, quantity: number = 1) {
    if (!shopifyClient) throw new Error('Shopify client not configured');
    return shopifyClient.addToCart(cartId, variantId, quantity);
  },

  async removeFromCart(cartId: string, lineIds: string[]) {
    if (!shopifyClient) throw new Error('Shopify client not configured');
    return shopifyClient.removeFromCart(cartId, lineIds);
  },

  async getCart(cartId: string) {
    if (!shopifyClient) throw new Error('Shopify client not configured');
    return shopifyClient.getCart(cartId);
  },
};

// Export the service directly (it's already a singleton object)
export const shopifyService = ShopifyService;
