import type { CartItem } from '@/types/store';
import type { ShopifyProduct, ShopifyProductVariant } from '@/lib/services/shopify';

// Mock product data
export const mockProduct: ShopifyProduct = {
  id: 'gid://shopify/Product/1',
  handle: 'test-product',
  title: 'Test Product',
  description: 'This is a test product description',
  descriptionHtml: '<p>This is a test product description</p>',
  featuredImage: {
    url: 'https://example.com/image.jpg',
    altText: 'Test product image',
  },
  images: [
    {
      url: 'https://example.com/image.jpg',
      altText: 'Test product image',
    },
  ],
  variants: [
    {
      id: 'gid://shopify/ProductVariant/1',
      sku: 'TEST-001',
      title: 'Default',
      availableForSale: true,
      quantityAvailable: 10,
      price: {
        amount: '100.00',
        currencyCode: 'EUR',
      },
      compareAtPrice: {
        amount: '150.00',
        currencyCode: 'EUR',
      },
      selectedOptions: [
        { name: 'Size', value: 'M' },
      ],
    },
  ],
  options: [
    {
      name: 'Size',
      values: ['S', 'M', 'L', 'XL'],
    },
  ],
  tags: ['new', 'featured'],
  vendor: 'Test Vendor',
  productType: 'Clothing',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  availableForSale: true,
  totalInventory: 100,
  priceRange: {
    minVariantPrice: {
      amount: '100.00',
      currencyCode: 'EUR',
    },
    maxVariantPrice: {
      amount: '100.00',
      currencyCode: 'EUR',
    },
  },
  seo: {
    title: 'Test Product SEO Title',
    description: 'Test Product SEO Description',
  },
};

// Mock cart item
export const mockCartItem: CartItem = {
  id: '1',
  lineItemId: 'line-1',
  productId: 'gid://shopify/Product/1',
  variantId: 'gid://shopify/ProductVariant/1',
  name: 'Test Product',
  variantTitle: 'Default',
  quantity: 2,
  price: 100,
  image: 'https://example.com/image.jpg',
  sku: 'TEST-001',
  vendor: 'Test Vendor',
  productType: 'Clothing',
  tags: ['new', 'featured'],
  availableForSale: true,
  selectedOptions: [
    { name: 'Size', value: 'M' },
  ],
  compareAtPrice: 150,
};

// Mock user data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '+1234567890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  email_verified: true,
  metadata: {},
};

// Mock order data
export const mockOrder = {
  id: '1',
  order_number: 'ORD-001',
  user_id: '1',
  status: 'completed' as const,
  total_amount: 200,
  currency: 'EUR',
  items: [mockCartItem],
  shipping_address: {
    id: '1',
    user_id: '1',
    type: 'shipping' as const,
    is_default: true,
    first_name: 'Test',
    last_name: 'User',
    address_line1: '123 Test St',
    city: 'Test City',
    state_province: 'Test State',
    postal_code: '12345',
    country_code: 'US',
    phone: '+1234567890',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock fetch responses
export const mockFetchResponse = (data: any, ok = true) => {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response);
};

// Mock Shopify API responses
export const mockShopifyProductsResponse = {
  products: {
    edges: [
      { node: mockProduct },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'start',
      endCursor: 'end',
    },
  },
};

export const mockShopifyCartResponse = {
  cartCreate: {
    cart: {
      id: 'gid://shopify/Cart/1',
      lines: [],
      cost: {
        totalAmount: { amount: '0.00', currencyCode: 'EUR' },
        subtotalAmount: { amount: '0.00', currencyCode: 'EUR' },
      },
      totalQuantity: 0,
      checkoutUrl: 'https://example.com/checkout',
    },
    userErrors: [],
  },
};