const { setupServer } = require('msw/node');
const { http, HttpResponse } = require('msw');

// Mock server for API testing
const mockApiUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

const server = setupServer(
  // Mock Medusa API endpoints
  http.get(`${mockApiUrl}/store/products`, () => {
    return HttpResponse.json({
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
    });
  }),

  http.get(`${mockApiUrl}/store/products/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
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
    });
  }),

  http.post(`${mockApiUrl}/store/carts`, () => {
    return HttpResponse.json({
      cart: {
        id: 'cart_test',
        items: [],
        total: 0,
        subtotal: 0,
        region: { id: 'region_1', currency_code: 'USD' },
      },
    });
  }),

  http.get(`${mockApiUrl}/store/carts/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      cart: {
        id,
        items: [],
        total: 0,
        subtotal: 0,
        region: { id: 'region_1', currency_code: 'USD' },
      },
    });
  }),

  http.post(`${mockApiUrl}/store/carts/:id/line-items`, () => {
    return HttpResponse.json({
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
    });
  }),

  http.get(`${mockApiUrl}/store/regions`, () => {
    return HttpResponse.json({
      regions: [
        {
          id: 'region_1',
          name: 'US',
          currency_code: 'USD',
          countries: [{ iso_2: 'us', display_name: 'United States' }],
        },
      ],
    });
  }),

  // Mock Stripe API
  http.post('https://api.stripe.com/v1/payment_intents', () => {
    return HttpResponse.json({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method',
      amount: 2000,
      currency: 'usd',
    });
  }),

  // Mock internal API endpoints
  http.post('/api/payments/create-intent', () => {
    return HttpResponse.json({
      client_secret: 'pi_test_123_secret',
    });
  }),

  http.get('/api/products', () => {
    return HttpResponse.json({
      products: [
        {
          id: 'prod_1',
          title: 'Test Product',
          price: '$20.00',
          image: '/test-image.jpg',
        },
      ],
    });
  }),
);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Export server for custom handlers in tests
module.exports = { server };