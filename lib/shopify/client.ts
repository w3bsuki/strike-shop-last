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

// Shopify Storefront API Client

export interface ShopifyConfig {
  domain: string;
  storefrontAccessToken: string;
  apiVersion?: string;
}

// Re-export types for backward compatibility
export type ShopifyProduct = Product;
export type ShopifyCollection = Collection;
export type ShopifyCart = Cart;

export class ShopifyClient {
  private client: GraphQLClient;

  constructor(config: ShopifyConfig) {
    const endpoint = `https://${config.domain}/api/${config.apiVersion || '2024-01'}/graphql.json`;
    
    this.client = new GraphQLClient(endpoint, {
      headers: {
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
    });
  }

  async query<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error) {
      console.error('Shopify GraphQL error:', error);
      throw error;
    }
  }

  // Product Methods
  async getProducts(first: number = 10): Promise<Product[]> {
    const query = `
      query getProducts($first: Int!) {
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

    const response = await this.query<{ products: Connection<Product> }>(query, { first });
    return response.products.edges.map(edge => edge.node);
  }

  async getProductByHandle(handle: string): Promise<Product | null> {
    const query = `
      query getProductByHandle($handle: String!) {
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

    const response = await this.query<{ productByHandle: Product | null }>(query, { handle });
    return response.productByHandle;
  }

  async getProductById(id: string): Promise<Product | null> {
    const query = `
      query getProductById($id: ID!) {
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

    const response = await this.query<{ product: Product | null }>(query, { id });
    return response.product;
  }

  async getCollections(first: number = 10): Promise<Collection[]> {
    const query = `
      query getCollections($first: Int!) {
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

    const response = await this.query<{ collections: Connection<Collection> }>(query, { first });
    console.log('Shopify collections response:', JSON.stringify(response, null, 2));
    return response.collections.edges.map(edge => edge.node);
  }

  // Product Search
  async searchProducts(query: string, first: number = 20): Promise<Product[]> {
    const searchQuery = `
      query searchProducts($query: String!, $first: Int!) {
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
    });
    return response.search.edges.map(edge => edge.node);
  }

  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    const query = `
      query getCollectionByHandle($handle: String!) {
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

    const response = await this.query<{ collectionByHandle: Collection | null }>(query, { handle });
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
    console.warn('⚠️ Shopify configuration missing. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN');
    return null;
  }
  
  return { domain, token };
};

const config = validateShopifyConfig();

// Initialize client with latest API version
export const shopifyClient = config ? new ShopifyClient({
  domain: config.domain,
  storefrontAccessToken: config.token,
  apiVersion: '2024-10', // Updated to latest API version
}) : null;

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