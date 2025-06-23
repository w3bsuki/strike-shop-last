import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';

// Mock cart store
const mockCartStore = {
  items: [],
  cartId: null,
  isOpen: false,
  isLoading: false,
  error: null,
  addItem: jest.fn(),
  removeItem: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  openCart: jest.fn(),
  closeCart: jest.fn(),
  clearError: jest.fn(),
  initializeCart: jest.fn(),
  getTotalPrice: jest.fn(() => 0),
  getTotalItems: jest.fn(() => 0),
  setState: jest.fn(),
  getState: jest.fn(() => mockCartStore),
};

// Mock zustand store
jest.mock('@/lib/cart-store', () => {
  const mockStore = {
    ...mockCartStore,
    setState: jest.fn((updater) => {
      if (typeof updater === 'function') {
        Object.assign(mockStore, updater(mockStore));
      } else {
        Object.assign(mockStore, updater);
      }
    }),
  };

  return {
    useCartStore: jest.fn(() => mockStore),
  };
});

// Custom render function
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Test data factories
export const createMockProduct = (overrides = {}) => ({
  id: 'prod_test123',
  slug: 'test-product',
  sku: 'TEST-SKU-001',
  content: {
    name: 'Test Product',
    description: 'A test product description',
    images: [
      {
        asset: {
          url: 'https://example.com/test-image.jpg',
          alt: 'Test Product',
        },
      },
    ],
    categories: [],
    tags: [],
  },
  commerce: {
    variants: [
      {
        id: 'variant_test123',
        title: 'Default Variant',
        sku: 'TEST-SKU-001',
        options: [{ option_id: 'opt_size', value: 'M' }],
        inventory_quantity: 10,
      },
    ],
    prices: [
      {
        id: 'price_test123',
        currency_code: 'gbp',
        amount: 2999, // £29.99
      },
    ],
    inventory: {
      available: true,
      quantity: 10,
    },
  },
  pricing: {
    currency: 'gbp',
    basePrice: 2999,
    displayPrice: '£29.99',
  },
  badges: {
    isNew: false,
    isSale: false,
    isLimited: false,
    isSoldOut: false,
  },
  ...overrides,
});

export const createMockCart = (overrides = {}) => ({
  id: 'cart_test123',
  email: 'test@example.com',
  customer_id: 'cust_test123',
  region_id: 'reg_gbp',
  currency_code: 'gbp',
  items: [],
  total: 0,
  subtotal: 0,
  tax_total: 0,
  shipping_total: 0,
  discount_total: 0,
  shipping_address: null,
  billing_address: null,
  payment_sessions: [],
  shipping_methods: [],
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user_test123',
  firstName: 'John',
  lastName: 'Doe',
  primaryEmailAddress: {
    emailAddress: 'john.doe@example.com',
  },
  primaryPhoneNumber: {
    phoneNumber: '+44 7700 900123',
  },
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 'order_test123',
  display_id: 1001,
  status: 'pending',
  fulfillment_status: 'not_fulfilled',
  payment_status: 'awaiting',
  email: 'test@example.com',
  currency_code: 'gbp',
  total: 2999,
  subtotal: 2999,
  tax_total: 600,
  shipping_total: 0,
  items: [],
  shipping_address: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Test Street',
    city: 'London',
    postal_code: 'SW1A 1AA',
    country_code: 'gb',
  },
  ...overrides,
});

// Utility functions for testing
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export const createMockPaymentIntent = (overrides = {}) => ({
  id: 'pi_test123',
  client_secret: 'pi_test123_secret_test',
  amount: 2999,
  currency: 'gbp',
  status: 'requires_payment_method',
  ...overrides,
});

// Export everything including the custom render
export * from '@testing-library/react';
export { customRender as render };
export { mockCartStore };
