import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const apiDuration = new Trend('api_duration');
const apiErrors = new Rate('api_errors');
const apiRequests = new Counter('api_requests');

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'api_duration': ['p(95)<300', 'p(99)<500'],
    'api_errors': ['rate<0.05'],
    'http_req_duration{api:products}': ['p(95)<200'],
    'http_req_duration{api:cart}': ['p(95)<300'],
    'http_req_duration{api:search}': ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    tags: {},
  };

  group('Product APIs', () => {
    // Get all products
    params.tags = { api: 'products' };
    let res = http.get(`${BASE_URL}/api/products?limit=20&offset=0`, params);
    apiRequests.add(1);
    apiDuration.add(res.timings.duration);
    const success = check(res, {
      'Products list status 200': (r) => r.status === 200,
      'Products list has data': (r) => JSON.parse(r.body).products.length > 0,
      'Products list fast response': (r) => r.timings.duration < 200,
    });
    apiErrors.add(!success);

    // Get single product
    res = http.get(`${BASE_URL}/api/products/prod_123`, params);
    apiRequests.add(1);
    apiDuration.add(res.timings.duration);
    check(res, {
      'Single product status 200': (r) => r.status === 200,
      'Single product has required fields': (r) => {
        const product = JSON.parse(r.body);
        return product.id && product.title && product.price;
      },
    });

    // Get product reviews
    res = http.get(`${BASE_URL}/api/reviews/prod_123`, params);
    apiRequests.add(1);
    apiDuration.add(res.timings.duration);
    check(res, {
      'Reviews status 200': (r) => r.status === 200,
    });
  });

  group('Search API', () => {
    params.tags = { api: 'search' };
    
    // Search with various queries
    const searchQueries = ['shirt', 'premium', 'sale', 'new arrival'];
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    
    const res = http.get(`${BASE_URL}/api/products?q=${query}&limit=10`, params);
    apiRequests.add(1);
    apiDuration.add(res.timings.duration);
    
    const success = check(res, {
      'Search status 200': (r) => r.status === 200,
      'Search returns results': (r) => {
        const body = JSON.parse(r.body);
        return body.products && Array.isArray(body.products);
      },
      'Search response time OK': (r) => r.timings.duration < 400,
    });
    apiErrors.add(!success);
  });

  group('Cart APIs', () => {
    params.tags = { api: 'cart' };
    
    // Create cart
    let res = http.post(`${BASE_URL}/api/cart`, '{}', params);
    apiRequests.add(1);
    apiDuration.add(res.timings.duration);
    
    let cartId;
    const cartCreated = check(res, {
      'Cart creation status 201': (r) => r.status === 201,
      'Cart has ID': (r) => {
        const cart = JSON.parse(r.body);
        cartId = cart.id;
        return cart.id !== undefined;
      },
    });
    apiErrors.add(!cartCreated);

    if (cartId) {
      // Add item to cart
      const addItemPayload = JSON.stringify({
        productId: 'prod_123',
        variantId: 'variant_123',
        quantity: 2,
      });
      
      res = http.post(`${BASE_URL}/api/cart/${cartId}/items`, addItemPayload, params);
      apiRequests.add(1);
      apiDuration.add(res.timings.duration);
      
      check(res, {
        'Add to cart status 200': (r) => r.status === 200,
        'Cart updated correctly': (r) => {
          const cart = JSON.parse(r.body);
          return cart.items && cart.items.length > 0;
        },
      });

      // Get cart
      res = http.get(`${BASE_URL}/api/cart/${cartId}`, params);
      apiRequests.add(1);
      apiDuration.add(res.timings.duration);
      
      check(res, {
        'Get cart status 200': (r) => r.status === 200,
        'Cart data complete': (r) => {
          const cart = JSON.parse(r.body);
          return cart.id && cart.items && cart.total !== undefined;
        },
      });
    }
  });

  group('Checkout API', () => {
    params.tags = { api: 'checkout' };
    
    // Create payment intent
    const paymentPayload = JSON.stringify({
      amount: 5000,
      currency: 'usd',
    });
    
    const res = http.post(`${BASE_URL}/api/payments/create-intent`, paymentPayload, params);
    apiRequests.add(1);
    apiDuration.add(res.timings.duration);
    
    const success = check(res, {
      'Payment intent status 200': (r) => r.status === 200,
      'Payment intent has client secret': (r) => {
        const data = JSON.parse(r.body);
        return data.client_secret !== undefined;
      },
      'Payment API response time OK': (r) => r.timings.duration < 500,
    });
    apiErrors.add(!success);
  });
}