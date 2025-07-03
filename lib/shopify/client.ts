import { GraphQLClient } from 'graphql-request';
import type {
  Product,
  Collection,
  Cart,
  Connection,
  CartCreatePayload,
  CartLinesAddPayload,
  CartLinesUpdatePayload,
  CartLinesRemovePayload,
  CartLineInput,
  CartLineUpdateInput,
} from './types';
import { logger, metrics, captureShopifyError } from '@/lib/monitoring';

// Shopify Storefront API Client

export interface ShopifyConfig {
  domain: string;
  storefrontAccessToken: string;
  apiVersion?: string;
}

export interface ShopifyRequestContext {
  language?: string; // ISO 639-1 language code (e.g., 'BG', 'EN', 'UK')
  country?: string;  // ISO 3166-1 alpha-2 country code (e.g., 'BG', 'US', 'UA')
  market?: string;   // Shopify market identifier
}

// Re-export types for backward compatibility
export type ShopifyProduct = Product;
export type ShopifyCollection = Collection;
export type ShopifyCart = Cart;

export class ShopifyClient {
  private client: GraphQLClient;
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = config;
    const apiVersion = config.apiVersion || '2025-01';
    const endpoint = `https://${config.domain}/api/${apiVersion}/graphql.json`;
    
    console.log('[ShopifyClient] Initializing with endpoint:', endpoint);
    
    this.client = new GraphQLClient(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
        'Accept': 'application/json',
      },
    });
  }

  async query<T>(query: string, variables: Record<string, any> = {}, context?: ShopifyRequestContext): Promise<T> {
    const apiVersion = this.config.apiVersion || '2025-01';
    const endpoint = `https://${this.config.domain}/api/${apiVersion}/graphql.json`;
    
    try {
      // Add locale context to variables if provided
      const enhancedVariables = { ...variables };
      if (context?.language) {
        enhancedVariables.language = context.language.toUpperCase();
      }
      if (context?.country) {
        enhancedVariables.country = context.country.toUpperCase();
      }
      
      console.log('[ShopifyClient] Making GraphQL request to:', endpoint);
      console.log('[ShopifyClient] Request variables:', enhancedVariables);
      console.log('[ShopifyClient] Context:', context);
      
      const result = await this.client.request<T>(query, enhancedVariables);
      console.log('[ShopifyClient] GraphQL response received successfully');
      return result;
    } catch (error: any) {
      // More robust error logging
      const errorDetails = {
        endpoint,
        message: error?.message || 'Unknown error',
        type: error?.constructor?.name || typeof error,
        stack: error?.stack
      };
      
      console.error('[ShopifyClient] GraphQL request failed:', errorDetails.message);
      
      if (error?.response) {
        console.error('Response status:', error.response.status);
        console.error('Response errors:', error.response.errors);
      }
      
      if (process.env.NODE_ENV === 'development' && error?.request) {
        console.error('Request details:', {
          query: query.substring(0, 300) + '...',
          variables
        });
      }
      
      // Handle GraphQL errors from response
      if (error?.response?.errors) {
        const gqlErrors = error.response.errors;
        console.error('[ShopifyClient] GraphQL errors:', gqlErrors);
        throw new Error(`Shopify GraphQL error: ${gqlErrors.map((e: any) => e.message).join(', ')}`);
      }
      
      // Check if it's a network error
      if (error?.message?.includes('fetch') || error?.message?.includes('ECONNREFUSED')) {
        throw new Error(`Network error connecting to Shopify: ${error.message}. Check your domain and network connection.`);
      }
      
      // Check for authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw new Error('Shopify authentication failed. Check your Storefront Access Token.');
      }
      
      // Re-throw with more context
      throw new Error(`Shopify GraphQL request failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Product Methods
  async getProducts(first: number = 10, context?: ShopifyRequestContext): Promise<Product[]> {
    const query = `
      query getProducts($first: Int!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              tags
              vendor
              productType
              createdAt
              updatedAt
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      url
                      altText
                    }
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ products: Connection<Product> }>(query, { first }, context);
    return response.products.edges.map(edge => edge.node);
  }

  async getProductByHandle(handle: string, context?: ShopifyRequestContext): Promise<Product | null> {
    const query = `
      query getProductByHandle($handle: String!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        productByHandle(handle: $handle) {
          id
          title
          handle
          description
          tags
          vendor
          productType
          createdAt
          updatedAt
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
                image {
                  url
                  altText
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const response = await this.query<{ productByHandle: Product | null }>(query, { handle }, context);
    return response.productByHandle;
  }

  async getProductById(id: string, context?: ShopifyRequestContext): Promise<Product | null> {
    const query = `
      query getProductById($id: ID!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        product(id: $id) {
          id
          title
          handle
          description
          tags
          vendor
          productType
          createdAt
          updatedAt
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
                image {
                  url
                  altText
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const response = await this.query<{ product: Product | null }>(query, { id }, context);
    return response.product;
  }

  async getCollections(first: number = 10, context?: ShopifyRequestContext): Promise<Collection[]> {
    const query = `
      query getCollections($first: Int!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              image {
                url
                altText
              }
              products(first: 10) {
                edges {
                  node {
                    id
                    title
                    handle
                    priceRange {
                      minVariantPrice {
                        amount
                        currencyCode
                      }
                    }
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ collections: Connection<Collection> }>(query, { first }, context);
    console.log('Shopify collections response:', JSON.stringify(response, null, 2));
    return response.collections.edges.map(edge => edge.node);
  }

  // Product Search
  async searchProducts(query: string, first: number = 20, context?: ShopifyRequestContext): Promise<Product[]> {
    const searchQuery = `
      query searchProducts($query: String!, $first: Int!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        search(query: $query, types: [PRODUCT], first: $first) {
          edges {
            node {
              ... on Product {
                id
                title
                handle
                description
                tags
                vendor
                productType
                createdAt
                updatedAt
                images(first: 3) {
                  edges {
                    node {
                      id
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      availableForSale
                      quantityAvailable
                      selectedOptions {
                        name
                        value
                      }
                      image {
                        url
                        altText
                      }
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ search: Connection<Product> }>(searchQuery, { 
      query, 
      first 
    }, context);
    return response.search.edges.map(edge => edge.node);
  }

  async getCollectionByHandle(handle: string, context?: ShopifyRequestContext): Promise<Collection | null> {
    const query = `
      query getCollectionByHandle($handle: String!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
        collectionByHandle(handle: $handle) {
          id
          title
          handle
          description
          image {
            url
            altText
          }
          products(first: 50) {
            edges {
              node {
                id
                title
                handle
                description
                tags
                vendor
                productType
                images(first: 3) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      availableForSale
                      quantityAvailable
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ collectionByHandle: Collection | null }>(query, { handle }, context);
    return response.collectionByHandle;
  }

  // Cart Methods
  async createCart(): Promise<Cart> {
    const mutation = `
      mutation cartCreate {
        cartCreate {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image {
                        url
                        altText
                      }
                      product {
                        id
                        title
                        handle
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.query<{ cartCreate: CartCreatePayload }>(mutation);
    if (!response.cartCreate.cart) {
      throw new Error('Failed to create cart');
    }
    return response.cartCreate.cart;
  }

  async addToCart(cartId: string, merchandiseId: string, quantity: number = 1): Promise<Cart> {
    const mutation = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image {
                        url
                        altText
                      }
                      product {
                        id
                        title
                        handle
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const variables = {
      cartId,
      lines: [{
        merchandiseId,
        quantity
      }] as CartLineInput[]
    };

    const response = await this.query<{ cartLinesAdd: CartLinesAddPayload }>(mutation, variables);
    if (!response.cartLinesAdd.cart) {
      throw new Error('Failed to add to cart');
    }
    return response.cartLinesAdd.cart;
  }

  async updateCartLines(cartId: string, lineId: string, quantity: number): Promise<Cart> {
    const mutation = `
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image {
                        url
                        altText
                      }
                      product {
                        id
                        title
                        handle
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const variables = {
      cartId,
      lines: [{
        id: lineId,
        quantity
      }] as CartLineUpdateInput[]
    };

    const response = await this.query<{ cartLinesUpdate: CartLinesUpdatePayload }>(mutation, variables);
    if (!response.cartLinesUpdate.cart) {
      throw new Error('Failed to update cart');
    }
    return response.cartLinesUpdate.cart;
  }

  async removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
    const mutation = `
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image {
                        url
                        altText
                      }
                      product {
                        id
                        title
                        handle
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const response = await this.query<{ cartLinesRemove: CartLinesRemovePayload }>(mutation, { cartId, lineIds });
    if (!response.cartLinesRemove.cart) {
      throw new Error('Failed to remove from cart');
    }
    return response.cartLinesRemove.cart;
  }

  async getCart(cartId: string): Promise<Cart | null> {
    const query = `
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    image {
                      url
                      altText
                    }
                    product {
                      id
                      title
                      handle
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{ cart: Cart | null }>(query, { cartId });
    return response.cart;
  }
}

// Environment validation and client initialization
const validateShopifyConfig = () => {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  
  if (!domain || !token) {
    console.error('❌ Shopify configuration missing:');
    console.error('  - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN:', domain ? '✅' : '❌');
    console.error('  - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:', token ? '✅' : '❌');
    console.error('Please check your .env.local file');
    return null;
  }
  
  return { domain, token };
};

const config = validateShopifyConfig();

// Initialize client with latest API version
export const shopifyClient = config ? new ShopifyClient({
  domain: config.domain,
  storefrontAccessToken: config.token,
  apiVersion: '2025-01', // Using latest stable API version
}) : null;

// Log initialization result
if (typeof window === 'undefined') {
  if (shopifyClient) {
    console.log('✅ Shopify client initialized successfully (server-side)');
  } else {
    console.log('❌ Shopify client could not be initialized - check environment variables');
  }
}

// Helper function to format Shopify price
export function formatPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(price);
}

// Helper function to get first image URL
export function getFirstImageUrl(product: Product): string {
  const firstImage = product.images.edges[0]?.node;
  return firstImage?.url || '/images/placeholder-product.jpg';
}

// Helper function to check if product is on sale
export function isProductOnSale(product: Product): boolean {
  return product.variants.edges.some(variant => {
    const compareAtPrice = variant.node.compareAtPrice;
    return compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(variant.node.price.amount);
  });
}