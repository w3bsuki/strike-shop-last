import { shopifyClient, getProducts, getProductByHandle, createCart } from './shopify';
import { mockFetchResponse, mockShopifyProductsResponse, mockShopifyCartResponse } from '@/__tests__/utils/mock-data';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('Shopify Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse({ data: {} }));
  });

  describe('shopifyClient', () => {
    it('throws error when required config is missing', () => {
      const originalDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
      delete process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

      expect(() => {
        // Force re-instantiation by clearing the module cache
        jest.resetModules();
        require('./shopify');
      }).toThrow('Missing required Shopify configuration');

      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = originalDomain;
    });
  });

  describe('getProducts', () => {
    it('fetches products with default parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ data: mockShopifyProductsResponse })
      );

      const result = await getProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/2024-10/graphql.json'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': expect.any(String),
          }),
          body: expect.stringContaining('currency: CurrencyCode!'),
        })
      );

      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe('gid://shopify/Product/1');
    });

    it('fetches products with custom currency and locale', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ data: mockShopifyProductsResponse })
      );

      await getProducts('BGN', 'bg', 10);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['Accept-Language']).toBe('bg-BG');
      expect(fetchCall[1].body).toContain('"currency":"BGN"');
      expect(fetchCall[1].body).toContain('"first":10');
    });

    it('handles GraphQL errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ errors: [{ message: 'GraphQL error' }] })
      );

      await expect(getProducts()).rejects.toThrow('GraphQL errors');
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(getProducts()).rejects.toThrow('Network error');
    });
  });

  describe('getProductByHandle', () => {
    it('fetches product by handle', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ 
          data: { 
            product: mockShopifyProductsResponse.products.edges[0].node 
          } 
        })
      );

      const result = await getProductByHandle('test-product');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('handle: String!'),
        })
      );

      expect(result).toBeTruthy();
      expect(result?.handle).toBe('test-product');
    });

    it('returns null when product not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ data: { product: null } })
      );

      const result = await getProductByHandle('non-existent');

      expect(result).toBeNull();
    });

    it('includes currency in price queries', async () => {
      await getProductByHandle('test-product', 'UAH', 'ua');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].body).toContain('"currency":"UAH"');
      expect(fetchCall[1].headers['Accept-Language']).toBe('uk-UA');
    });
  });

  describe('createCart', () => {
    it('creates cart with default parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ data: mockShopifyCartResponse })
      );

      const result = await createCart();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('cartCreate'),
        })
      );

      expect(result.id).toBe('gid://shopify/Cart/1');
      expect(result.checkoutUrl).toBe('https://example.com/checkout');
    });

    it('creates cart with buyer identity', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ data: mockShopifyCartResponse })
      );

      await createCart('EUR', {
        countryCode: 'BG',
        email: 'test@example.com',
        phone: '+359123456789',
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body.variables.input.buyerIdentity).toEqual({
        countryCode: 'BG',
        email: 'test@example.com',
        phone: '+359123456789',
      });
    });

    it('handles cart creation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse({ 
          data: {
            cartCreate: {
              cart: null,
              userErrors: [{ field: 'input', message: 'Invalid input' }],
            },
          },
        })
      );

      await expect(createCart()).rejects.toThrow('Cart creation failed: Invalid input');
    });
  });

  describe('Region Configuration', () => {
    it('returns correct region config for locale', () => {
      const bgConfig = shopifyClient.getRegionConfig('bg');
      expect(bgConfig.currency).toBe('BGN');
      expect(bgConfig.countryCode).toBe('BG');
      expect(bgConfig.taxIncluded).toBe(true);
    });

    it('returns supported currencies for locale', () => {
      const currencies = shopifyClient.getSupportedCurrencies('ua');
      expect(currencies).toEqual(['UAH']);
    });

    it('returns shipping zones for locale', () => {
      const zones = shopifyClient.getShippingZones('en');
      expect(zones).toContain('EU');
      expect(zones).toContain('UK');
      expect(zones).toContain('International');
    });

    it('returns payment methods for locale', () => {
      const methods = shopifyClient.getPaymentMethods('bg');
      expect(methods).toContain('card');
      expect(methods).toContain('bank_transfer');
    });
  });
});