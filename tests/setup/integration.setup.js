import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock server for API testing
const mockApiUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

const server = setupServer(
  // Mock Medusa API endpoints
  rest.get(`${mockApiUrl}/store/products`, (req, res, ctx) => {
    return res(
      ctx.json({
        products: [
          {
            id: 'prod_1',
            title: 'Test Product 1',
            handle: 'test-product-1',
            variants: [
              {
                id: 'variant_1',
                prices: [{ amount: 2000, currency_code: 'USD' }],
              },
            ],
          },
        ],
        count: 1,
        offset: 0,
        limit: 100,
      })
    );
  }),

  rest.get(`${mockApiUrl}/store/products/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        product: {
          id,
          title: 'Test Product',
          handle: 'test-product',
          variants: [
            {
              id: 'variant_1',
              prices: [{ amount: 2000, currency_code: 'USD' }],
            },
          ],
        },
      })
    );
  }),

  rest.post(`${mockApiUrl}/store/carts`, (req, res, ctx) => {
    return res(
      ctx.json({
        cart: {
          id: 'cart_test',
          items: [],
          total: 0,
          subtotal: 0,
          region: { id: 'region_1', currency_code: 'USD' },
        },
      })
    );
  }),

  rest.get(`${mockApiUrl}/store/carts/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        cart: {
          id,
          items: [],
          total: 0,
          subtotal: 0,
          region: { id: 'region_1', currency_code: 'USD' },
        },
      })
    );
  }),

  rest.post(`${mockApiUrl}/store/carts/:id/line-items`, (req, res, ctx) => {
    return res(
      ctx.json({
        cart: {
          id: 'cart_test',
          items: [
            {
              id: 'item_1',
              quantity: 1,
              variant: { id: 'variant_1' },
              unit_price: 2000,
              total: 2000,
            },
          ],
          total: 2000,
          subtotal: 2000,
        },
      })
    );
  }),

  rest.get(`${mockApiUrl}/store/regions`, (req, res, ctx) => {
    return res(
      ctx.json({
        regions: [
          {
            id: 'region_1',
            name: 'US',
            currency_code: 'USD',
            countries: [{ iso_2: 'us', display_name: 'United States' }],
          },
        ],
      })
    );
  }),

  // Mock Stripe API
  rest.post('https://api.stripe.com/v1/payment_intents', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
        amount: 2000,
        currency: 'usd',
      })
    );
  }),

  // Mock internal API endpoints
  rest.post('/api/payments/create-intent', (req, res, ctx) => {
    return res(
      ctx.json({
        client_secret: 'pi_test_123_secret',
      })
    );
  }),

  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.json({
        products: [
          {
            id: 'prod_1',
            title: 'Test Product',
            price: '$20.00',
            image: '/test-image.jpg',
          },
        ],
      })
    );
  }),
);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  });
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});

// Database test utilities
global.testDb = {
  // Mock database operations for testing
  createTestProduct: async (data = {}) => ({
    id: 'test-product-id',
    title: 'Test Product',
    price: 2000,
    ...data,
  }),

  createTestUser: async (data = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    ...data,
  }),

  createTestCart: async (data = {}) => ({
    id: 'test-cart-id',
    items: [],
    total: 0,
    ...data,
  }),

  cleanup: async () => {
    // Cleanup test data
    console.log('Cleaning up test database');
  },
};

// Integration test utilities
global.integrationUtils = {
  server,
  
  // Helper to test API endpoints
  testApiEndpoint: async (endpoint, method = 'GET', data = null) => {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : null,
    });
    
    return {
      status: response.status,
      data: await response.json(),
    };
  },

  // Helper to simulate user actions
  simulateUserAction: async (action, data) => {
    switch (action) {
      case 'addToCart':
        return testDb.createTestCart({
          items: [{ ...data, quantity: 1 }],
        });
      case 'createUser':
        return testDb.createTestUser(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  },
};

// Setup integration test environment
beforeEach(async () => {
  // Reset test database state
  await testDb.cleanup();
});

afterEach(async () => {
  // Cleanup after each test
  await testDb.cleanup();
});