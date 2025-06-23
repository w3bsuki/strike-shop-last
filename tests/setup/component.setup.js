import { axe, toHaveNoViolations } from 'jest-axe';
import { configure } from '@testing-library/react';

// Extend Jest matchers with accessibility testing
expect.extend(toHaveNoViolations);

// Configure testing library for better component testing
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Global accessibility testing helper
global.axe = axe;

// Mock next/image for component tests
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock next/link for component tests
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock framer-motion to prevent animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useInView: () => true,
}));

// Custom testing utilities
global.testUtils = {
  createMockProduct: (overrides = {}) => ({
    id: 'prod_test_123',
    title: 'Test Product',
    handle: 'test-product',
    description: 'A test product',
    images: [{ id: 'img_1', url: 'http://example.com/image.jpg' }],
    variants: [
      {
        id: 'variant_1',
        title: 'Default',
        prices: [{ amount: 2000, currency_code: 'USD' }],
        inventory_quantity: 10,
      },
    ],
    options: [],
    tags: [],
    type: { value: 'test-type' },
    collection: { handle: 'test-collection' },
    ...overrides,
  }),

  createMockUser: (overrides = {}) => ({
    id: 'user_test_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  }),

  createMockCart: (overrides = {}) => ({
    id: 'cart_test_123',
    items: [],
    subtotal: 0,
    total: 0,
    currency: { code: 'USD' },
    region: { id: 'region_1', currency_code: 'USD' },
    ...overrides,
  }),

  // Helper to test component accessibility
  testAccessibility: async (component) => {
    const results = await axe(component);
    expect(results).toHaveNoViolations();
  },

  // Helper to test keyboard navigation
  testKeyboardNavigation: async (user, element, expectedFocusedElement) => {
    await user.tab();
    expect(expectedFocusedElement).toHaveFocus();
  },
};

// Setup component test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset console mocks
  console.warn.mockClear();
  console.error.mockClear();
});

afterEach(() => {
  // Cleanup any mounted components
  document.body.innerHTML = '';
});

// Add testUtils to global scope for convenience
global.testUtils = {
  ...global.testUtils,
  
  // Helper to test component accessibility
  testAccessibility: async (component) => {
    const results = await axe(component);
    expect(results).toHaveNoViolations();
  },

  // Helper to test keyboard navigation
  testKeyboardNavigation: async (user, element, expectedFocusedElement) => {
    await user.tab();
    expect(expectedFocusedElement).toHaveFocus();
  },
};