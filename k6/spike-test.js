import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Spike test configuration - sudden increase in traffic
export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Warm up
    { duration: '1m', target: 10 },     // Stay at 10 users
    { duration: '10s', target: 500 },   // Spike to 500 users
    { duration: '3m', target: 500 },    // Stay at 500 users
    { duration: '10s', target: 10 },    // Scale down to 10 users
    { duration: '3m', target: 10 },     // Continue at 10 users
    { duration: '10s', target: 0 },     // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s during spike
    http_req_failed: ['rate<0.2'],     // Error rate must be below 20% during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Simulate Black Friday / Flash Sale scenario
export default function () {
  const productId = `prod_${Math.floor(Math.random() * 100)}`;
  
  // User rushes to get a deal
  let res = http.get(`${BASE_URL}/`);
  check(res, { 'Homepage accessible during spike': (r) => r.status === 200 });
  
  // Quick navigation to deals
  res = http.get(`${BASE_URL}/categories/flash-sale`);
  check(res, { 'Flash sale page accessible': (r) => r.status === 200 });
  
  // View hot product
  res = http.get(`${BASE_URL}/product/${productId}`);
  check(res, { 'Product page loads': (r) => r.status === 200 });
  
  // Rush to add to cart
  const cartPayload = JSON.stringify({
    productId: productId,
    variantId: 'variant_1',
    quantity: 1,
  });
  
  res = http.post(`${BASE_URL}/api/cart/items`, cartPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(res, {
    'Can add to cart during spike': (r) => r.status === 200 || r.status === 201,
    'Cart response time acceptable': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
}