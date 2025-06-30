import { shopifyClient } from './client';
import type { Product, Collection, ProductVariant } from './types';
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

  const variant: IntegratedVariant = {
    id: createVariantId(shopifyVariant.id),
    title: shopifyVariant.title,
    
    options: shopifyVariant.selectedOptions.reduce((acc: Record<string, any>, option) => {
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
        url: createImageURL(shopifyVariant.image.url),
        alt: shopifyVariant.image.altText || shopifyVariant.title,
      }]
    }),
  };

  return variant;
}

// Transform Shopify collection to our internal format
export function transformShopifyCollection(shopifyCollection: Collection): IntegratedCollection {
  return {
    id: shopifyCollection.id,
    name: shopifyCollection.title,
    slug: shopifyCollection.handle,
    description: shopifyCollection.description,
    ...(shopifyCollection.image && {
      image: {
        url: createImageURL(shopifyCollection.image.url),
        alt: shopifyCollection.image.altText || shopifyCollection.title,
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

// Service functions that can be called from components
export const ShopifyService = {
  // Search products
  async searchProducts(query: string, limit: number = 20): Promise<IntegratedProduct[]> {
    try {
      if (!shopifyClient) {
        console.warn('Shopify client not configured, returning empty results');
        return [];
      }

      const shopifyProducts = await shopifyClient.searchProducts(query, limit);
      return shopifyProducts.map(transformShopifyProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Get all products
  async getProducts(limit: number = 20): Promise<IntegratedProduct[]> {
    try {
      if (!shopifyClient) {
        console.warn('Shopify client not configured, returning empty results');
        return [];
      }

      const shopifyProducts = await shopifyClient.getProducts(limit);
      return shopifyProducts.map(transformShopifyProduct);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get product by handle/slug
  async getProductBySlug(slug: string): Promise<IntegratedProduct | null> {
    try {
      if (!shopifyClient) return null;
      const shopifyProduct = await shopifyClient.getProductByHandle(slug);
      return shopifyProduct ? transformShopifyProduct(shopifyProduct) : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get all collections
  async getCollections(): Promise<IntegratedCollection[]> {
    try {
      if (!shopifyClient) return [];
      const shopifyCollections = await shopifyClient.getCollections(20);
      return shopifyCollections.map(transformShopifyCollection);
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },

  // Get collection by handle
  async getCollectionBySlug(slug: string): Promise<IntegratedCollection | null> {
    try {
      if (!shopifyClient) return null;
      const shopifyCollection = await shopifyClient.getCollectionByHandle(slug);
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