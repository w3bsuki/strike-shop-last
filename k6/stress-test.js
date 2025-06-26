import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Stress test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Below normal load
    { duration: '5m', target: 100 },   // Normal load
    { duration: '2m', target: 200 },   // Around breaking point
    { duration: '5m', target: 200 },   // At breaking point
    { duration: '2m', target: 300 },   // Beyond breaking point
    { duration: '5m', target: 300 },   // Beyond breaking point
    { duration: '10m', target: 0 },    // Scale down. Recovery stage
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    errors: ['rate<0.3'],              // Error rate must be below 30%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  // Critical user journey under stress
  const responses = [];
  
  // 1. Load homepage
  let res = http.get(`${BASE_URL}/`);
  responses.push(res);
  
  // 2. Browse products
  res = http.get(`${BASE_URL}/api/products?limit=50`);
  responses.push(res);
  
  // 3. Search specific product
  res = http.get(`${BASE_URL}/api/products?q=premium&limit=20`);
  responses.push(res);
  
  // 4. View product details
  res = http.get(`${BASE_URL}/product/stress-test-product`);
  responses.push(res);
  
  // 5. Check product availability
  res = http.get(`${BASE_URL}/api/products/prod_123/availability`);
  responses.push(res);
  
  // Check all responses
  responses.forEach((response, index) => {
    const success = check(response, {
      [`Request ${index + 1} succeeds`]: (r) => r.status === 200,
      [`Request ${index + 1} completes within SLA`]: (r) => r.timings.duration < 2000,
    });
    errorRate.add(!success);
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}