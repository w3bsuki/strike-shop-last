// Shopify Multi-Region Service Module
import { SupportedCurrency } from '@/lib/currency/currency-context';
import { Locale, shopifyLocaleMap } from '@/lib/i18n/config';

// Regional configuration for Shopify markets
export interface RegionConfig {
  locale: Locale;
  currency: SupportedCurrency;
  market: string; // Shopify market ID
  countryCode: string;
  shippingZones: string[];
  taxIncluded: boolean;
  paymentMethods: string[];
}

export const REGION_CONFIGS: Record<Locale, RegionConfig> = {
  en: {
    locale: 'en',
    currency: 'EUR',
    market: 'EU',
    countryCode: 'GB', // Default to UK for English
    shippingZones: ['EU', 'UK', 'International'],
    taxIncluded: true,
    paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
  },
  bg: {
    locale: 'bg',
    currency: 'BGN',
    market: 'BG',
    countryCode: 'BG',
    shippingZones: ['BG', 'EU'],
    taxIncluded: true,
    paymentMethods: ['card', 'bank_transfer'],
  },
  ua: {
    locale: 'ua',
    currency: 'UAH',
    market: 'UA',
    countryCode: 'UA',
    shippingZones: ['UA', 'International'],
    taxIncluded: false,
    paymentMethods: ['card'],
  },
};

// Enhanced Shopify interfaces with multi-currency support
export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductVariant {
  id: string;
  sku?: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number;
  price: ShopifyMoney;
  compareAtPrice?: ShopifyMoney;
  image?: {
    url: string;
    altText?: string;
  };
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  images: Array<{
    url: string;
    altText?: string;
  }>;
  variants: ShopifyProductVariant[];
  options: Array<{
    name: string;
    values: string[];
  }>;
  tags: string[];
  vendor: string;
  productType: string;
  createdAt: string;
  updatedAt: string;
  availableForSale: boolean;
  totalInventory?: number;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  compareAtPriceRange?: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  seo: {
    title?: string;
    description?: string;
  };
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image?: {
    url: string;
    altText?: string;
  };
  products: ShopifyProduct[];
  updatedAt: string;
}

export interface ShopifyCart {
  id: string;
  lines: Array<{
    id: string;
    quantity: number;
    merchandise: {
      id: string;
      title: string;
      selectedOptions: Array<{
        name: string;
        value: string;
      }>;
      product: {
        id: string;
        handle: string;
        title: string;
        featuredImage?: {
          url: string;
          altText?: string;
        };
      };
    };
    cost: {
      totalAmount: ShopifyMoney;
      subtotalAmount: ShopifyMoney;
      compareAtAmountPerQuantity?: ShopifyMoney;
    };
  }>;
  cost: {
    totalAmount: ShopifyMoney;
    subtotalAmount: ShopifyMoney;
    totalTaxAmount?: ShopifyMoney;
    totalDutyAmount?: ShopifyMoney;
  };
  totalQuantity: number;
  checkoutUrl: string;
  estimatedCost: {
    totalAmount: ShopifyMoney;
    subtotalAmount: ShopifyMoney;
    totalTaxAmount?: ShopifyMoney;
    totalDutyAmount?: ShopifyMoney;
  };
}

// Shopify client configuration
class ShopifyClient {
  private domain: string;
  private storefrontAccessToken: string;
  private adminAccessToken?: string;

  constructor() {
    this.domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
    this.storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
    this.adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!this.domain || !this.storefrontAccessToken) {
      throw new Error('Missing required Shopify configuration');
    }
  }

  private async storefrontRequest<T>(
    query: string,
    variables: Record<string, any> = {},
    locale?: Locale
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken,
    };

    // Add locale-specific headers
    if (locale) {
      headers['Accept-Language'] = shopifyLocaleMap[locale];
    }

    const response = await fetch(`https://${this.domain}/api/2024-10/graphql.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    return json.data;
  }

  // Product queries with multi-currency support
  async getProducts(
    currency: SupportedCurrency = 'EUR',
    locale?: Locale,
    first = 20,
    after?: string
  ): Promise<{ products: ShopifyProduct[]; pageInfo: any }> {
    const query = `
      query GetProducts($first: Int!, $after: String, $currency: CurrencyCode!) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              handle
              title
              description
              descriptionHtml
              featuredImage {
                url
                altText
              }
              images(first: 10) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    sku
                    title
                    availableForSale
                    quantityAvailable
                    price(currency: $currency) {
                      amount
                      currencyCode
                    }
                    compareAtPrice(currency: $currency) {
                      amount
                      currencyCode
                    }
                    image {
                      url
                      altText
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              options {
                name
                values
              }
              tags
              vendor
              productType
              createdAt
              updatedAt
              availableForSale
              totalInventory
              priceRange {
                minVariantPrice(currency: $currency) {
                  amount
                  currencyCode
                }
                maxVariantPrice(currency: $currency) {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice(currency: $currency) {
                  amount
                  currencyCode
                }
                maxVariantPrice(currency: $currency) {
                  amount
                  currencyCode
                }
              }
              seo {
                title
                description
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const data = await this.storefrontRequest<any>(
      query,
      { first, after, currency },
      locale
    );

    return {
      products: data.products.edges.map((edge: any) => ({
        ...edge.node,
        images: edge.node.images.edges.map((img: any) => img.node),
        variants: edge.node.variants.edges.map((variant: any) => variant.node),
      })),
      pageInfo: data.products.pageInfo,
    };
  }

  async getProductByHandle(
    handle: string,
    currency: SupportedCurrency = 'EUR',
    locale?: Locale
  ): Promise<ShopifyProduct | null> {
    const query = `
      query GetProductByHandle($handle: String!, $currency: CurrencyCode!) {
        product(handle: $handle) {
          id
          handle
          title
          description
          descriptionHtml
          featuredImage {
            url
            altText
          }
          images(first: 20) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                sku
                title
                availableForSale
                quantityAvailable
                price(currency: $currency) {
                  amount
                  currencyCode
                }
                compareAtPrice(currency: $currency) {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
          tags
          vendor
          productType
          createdAt
          updatedAt
          availableForSale
          totalInventory
          priceRange {
            minVariantPrice(currency: $currency) {
              amount
              currencyCode
            }
            maxVariantPrice(currency: $currency) {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice(currency: $currency) {
              amount
              currencyCode
            }
            maxVariantPrice(currency: $currency) {
              amount
              currencyCode
            }
          }
          seo {
            title
            description
          }
        }
      }
    `;

    const data = await this.storefrontRequest<any>(
      query,
      { handle, currency },
      locale
    );

    if (!data.product) {
      return null;
    }

    return {
      ...data.product,
      images: data.product.images.edges.map((edge: any) => edge.node),
      variants: data.product.variants.edges.map((edge: any) => edge.node),
    };
  }

  async getCollection(
    handle: string,
    currency: SupportedCurrency = 'EUR',
    locale?: Locale,
    first = 20
  ): Promise<ShopifyCollection | null> {
    const query = `
      query GetCollection($handle: String!, $currency: CurrencyCode!, $first: Int!) {
        collection(handle: $handle) {
          id
          handle
          title
          description
          image {
            url
            altText
          }
          products(first: $first) {
            edges {
              node {
                id
                handle
                title
                description
                featuredImage {
                  url
                  altText
                }
                priceRange {
                  minVariantPrice(currency: $currency) {
                    amount
                    currencyCode
                  }
                  maxVariantPrice(currency: $currency) {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  minVariantPrice(currency: $currency) {
                    amount
                    currencyCode
                  }
                  maxVariantPrice(currency: $currency) {
                    amount
                    currencyCode
                  }
                }
                availableForSale
                tags
                vendor
                productType
                updatedAt
              }
            }
          }
          updatedAt
        }
      }
    `;

    const data = await this.storefrontRequest<any>(
      query,
      { handle, currency, first },
      locale
    );

    if (!data.collection) {
      return null;
    }

    return {
      ...data.collection,
      products: data.collection.products.edges.map((edge: any) => edge.node),
    };
  }

  // Cart operations with multi-currency support
  async createCart(
    currency: SupportedCurrency = 'EUR',
    buyerIdentity?: {
      countryCode: string;
      email?: string;
      phone?: string;
    }
  ): Promise<ShopifyCart> {
    const query = `
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        id
                        handle
                        title
                        featuredImage {
                          url
                          altText
                        }
                      }
                    }
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                    subtotalAmount {
                      amount
                      currencyCode
                    }
                    compareAtAmountPerQuantity {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
              totalDutyAmount {
                amount
                currencyCode
              }
            }
            totalQuantity
            checkoutUrl
            estimatedCost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
              totalDutyAmount {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const cartInput: any = {
      lines: [],
    };

    if (buyerIdentity) {
      cartInput.buyerIdentity = {
        countryCode: buyerIdentity.countryCode,
        ...(buyerIdentity.email && { email: buyerIdentity.email }),
        ...(buyerIdentity.phone && { phone: buyerIdentity.phone }),
      };
    }

    const data = await this.storefrontRequest<any>(query, { input: cartInput });

    if (data.cartCreate.userErrors?.length > 0) {
      throw new Error(`Cart creation failed: ${data.cartCreate.userErrors[0].message}`);
    }

    const cart = data.cartCreate.cart;
    return {
      ...cart,
      lines: cart.lines.edges.map((edge: any) => edge.node),
    };
  }

  // Additional utility methods
  getRegionConfig(locale: Locale): RegionConfig {
    return REGION_CONFIGS[locale];
  }

  getSupportedCurrencies(locale: Locale): SupportedCurrency[] {
    const config = this.getRegionConfig(locale);
    return [config.currency];
  }

  getShippingZones(locale: Locale): string[] {
    return this.getRegionConfig(locale).shippingZones;
  }

  getPaymentMethods(locale: Locale): string[] {
    return this.getRegionConfig(locale).paymentMethods;
  }
}

// Create singleton instance
export const shopifyClient = new ShopifyClient();

// Convenience functions that use the current user's locale/currency context
export async function getProducts(
  currency: SupportedCurrency = 'EUR',
  locale?: Locale,
  first = 20,
  after?: string
): Promise<{ products: ShopifyProduct[]; pageInfo: any }> {
  return shopifyClient.getProducts(currency, locale, first, after);
}

export async function getProductByHandle(
  handle: string,
  currency: SupportedCurrency = 'EUR',
  locale?: Locale
): Promise<ShopifyProduct | null> {
  return shopifyClient.getProductByHandle(handle, currency, locale);
}

export async function getProductById(
  id: string,
  currency: SupportedCurrency = 'EUR',
  locale?: Locale
): Promise<ShopifyProduct | null> {
  // Convert ID to handle-based lookup (if needed) or implement by ID query
  // For now, return null as this requires the handle
  console.warn('getProductById not yet implemented - use getProductByHandle instead');
  return null;
}

export async function getProductsByCategory(
  category: string,
  currency: SupportedCurrency = 'EUR',
  locale?: Locale,
  first = 20
): Promise<ShopifyProduct[]> {
  const collection = await shopifyClient.getCollection(category, currency, locale, first);
  return collection?.products || [];
}

export async function getCollection(
  handle: string,
  currency: SupportedCurrency = 'EUR',
  locale?: Locale,
  first = 20
): Promise<ShopifyCollection | null> {
  return shopifyClient.getCollection(handle, currency, locale, first);
}

export async function createCart(
  currency: SupportedCurrency = 'EUR',
  buyerIdentity?: {
    countryCode: string;
    email?: string;
    phone?: string;
  }
): Promise<ShopifyCart> {
  return shopifyClient.createCart(currency, buyerIdentity);
}

// All types are already exported via individual export statements above