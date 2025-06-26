import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up to 20 users over 30 seconds
    { duration: '2m', target: 50 },    // Stay at 50 users for 2 minutes
    { duration: '1m', target: 100 },   // Ramp-up to 100 users over 1 minute
    { duration: '3m', target: 100 },   // Stay at 100 users for 3 minutes
    { duration: '1m', target: 0 },     // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],                   // Error rate must be below 10%
    errors: ['rate<0.1'],                            // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Test scenarios
export default function () {
  // Homepage test
  let res = http.get(`${BASE_URL}/`);
  let success = check(res, {
    'Homepage loads successfully': (r) => r.status === 200,
    'Homepage loads in reasonable time': (r) => r.timings.duration < 500,
  });
  errorRate.add(!success);
  sleep(1);

  // Browse categories
  res = http.get(`${BASE_URL}/categories/mens`);
  success = check(res, {
    'Category page loads successfully': (r) => r.status === 200,
    'Category page loads in reasonable time': (r) => r.timings.duration < 500,
  });
  errorRate.add(!success);
  sleep(2);

  // Search products
  res = http.get(`${BASE_URL}/api/products?q=shirt&limit=20`);
  success = check(res, {
    'Product search API responds successfully': (r) => r.status === 200,
    'Product search API responds quickly': (r) => r.timings.duration < 300,
    'Product search returns results': (r) => {
      const body = JSON.parse(r.body);
      return body && body.products && body.products.length > 0;
    },
  });
  errorRate.add(!success);
  sleep(1);

  // View product details
  res = http.get(`${BASE_URL}/product/sample-product`);
  success = check(res, {
    'Product page loads successfully': (r) => r.status === 200,
    'Product page loads in reasonable time': (r) => r.timings.duration < 500,
  });
  errorRate.add(!success);
  sleep(2);

  // Add to cart simulation
  const cartPayload = JSON.stringify({
    productId: 'prod_123',
    variantId: 'variant_123',
    quantity: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  res = http.post(`${BASE_URL}/api/cart/items`, cartPayload, params);
  success = check(res, {
    'Add to cart succeeds': (r) => r.status === 200 || r.status === 201,
    'Add to cart responds quickly': (r) => r.timings.duration < 500,
  });
  errorRate.add(!success);
  sleep(1);

  // Checkout page (just loading, not completing)
  res = http.get(`${BASE_URL}/checkout`);
  success = check(res, {
    'Checkout page loads successfully': (r) => r.status === 200,
    'Checkout page loads in reasonable time': (r) => r.timings.duration < 700,
  });
  errorRate.add(!success);
  sleep(3);
}