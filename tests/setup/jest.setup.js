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

// Mock Request and Response for Next.js
if (!global.Request) {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }
    
    text() {
      return Promise.resolve(this.body || '');
    }
  };
}

if (!global.Response) {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }
    
    text() {
      return Promise.resolve(this.body || '');
    }
  };
}

if (!global.Headers) {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = {};
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
    
    get(name) {
      return this._headers[name.toLowerCase()] || null;
    }
    
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    
    has(name) {
      return name.toLowerCase() in this._headers;
    }
    
    delete(name) {
      delete this._headers[name.toLowerCase()];
    }
    
    entries() {
      return Object.entries(this._headers);
    }
  };
}

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

// Mock lucide-react icon imports
const mockIcon = (props) => {
  const React = require('react');
  return React.createElement('svg', { ...props, 'data-testid': 'mock-icon' });
};

// Create list of icon names and their paths
const iconMap = {
  'search': 'Search',
  'menu': 'Menu',
  'x': 'X',
  'shopping-cart': 'ShoppingCart',
  'user': 'User',
  'heart': 'Heart',
  'star': 'Star',
  'plus': 'Plus',
  'minus': 'Minus',
  'chevron-down': 'ChevronDown',
  'chevron-up': 'ChevronUp',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'filter': 'Filter',
  'sliders-horizontal': 'SlidersHorizontal',
  'grid-3x3': 'Grid3X3',
  'list': 'List',
  'trash-2': 'Trash2',
  'edit': 'Edit',
  'eye': 'Eye',
  'eye-off': 'EyeOff',
  'check': 'Check',
  'alert-circle': 'AlertCircle',
  'info': 'Info',
  'loader-2': 'Loader2',
};

// Mock individual icon imports
Object.entries(iconMap).forEach(([path, name]) => {
  jest.mock(`lucide-react/dist/esm/icons/${path}`, () => ({
    [name]: mockIcon,
    default: mockIcon,
  }), { virtual: true });
});
