import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useParams() {
    return {};
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: false,
    userId: null,
    sessionId: null,
    getToken: jest.fn(),
  }),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div data-testid="user-button" />,
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() =>
    Promise.resolve({
      elements: jest.fn(() => ({
        create: jest.fn(() => ({
          mount: jest.fn(),
          unmount: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
        })),
        getElement: jest.fn(),
      })),
      confirmPayment: jest.fn(),
      retrievePaymentIntent: jest.fn(),
    })
  ),
}));

// Mock Medusa client
jest.mock('@/lib/medusa', () => ({
  medusaClient: {
    carts: {
      retrieve: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addLineItem: jest.fn(),
      updateLineItem: jest.fn(),
      deleteLineItem: jest.fn(),
      addShippingMethod: jest.fn(),
    },
    products: {
      list: jest.fn(),
      retrieve: jest.fn(),
    },
    regions: {
      list: jest.fn(),
    },
    shippingOptions: {
      listCartOptions: jest.fn(),
    },
    orders: {
      retrieve: jest.fn(),
    },
  },
  medusaSDK: {
    store: {
      product: {
        list: jest.fn(),
        retrieve: jest.fn(),
      },
      cart: {
        create: jest.fn(),
        retrieve: jest.fn(),
        addLineItem: jest.fn(),
        updateLineItem: jest.fn(),
        deleteLineItem: jest.fn(),
      },
      region: {
        list: jest.fn(),
        retrieve: jest.fn(),
      },
      order: {
        retrieve: jest.fn(),
      },
    },
  },
  medusaService: {
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    createCart: jest.fn(),
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    getRegions: jest.fn(),
    getRegion: jest.fn(),
    getOrder: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    clearCache: jest.fn(),
  },
  MedusaService: {
    getInstance: jest.fn(() => ({
      getProducts: jest.fn(),
      getProduct: jest.fn(),
      createCart: jest.fn(),
      getCart: jest.fn(),
      addToCart: jest.fn(),
      updateCartItem: jest.fn(),
      removeFromCart: jest.fn(),
      getRegions: jest.fn(),
      getRegion: jest.fn(),
      getOrder: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
      clearCache: jest.fn(),
    })),
  },
}));

// Mock Sanity client
jest.mock('@/lib/sanity', () => ({
  sanityClient: {
    fetch: jest.fn().mockResolvedValue([]),
    listen: jest.fn(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
  urlFor: jest.fn(() => ({
    width: jest.fn().mockReturnThis(),
    height: jest.fn().mockReturnThis(),
    url: jest.fn(() => 'mock-image-url'),
  })),
  imageBuilder: {
    image: jest.fn(() => ({
      width: jest.fn().mockReturnThis(),
      height: jest.fn().mockReturnThis(),
      url: jest.fn(() => 'mock-image-url'),
    })),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock scrollTo
global.scrollTo = jest.fn();

// Setup TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
