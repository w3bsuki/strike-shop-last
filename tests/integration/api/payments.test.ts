/**
 * Payments API Integration Tests
 * Comprehensive test suite for Payments API endpoints
 * Tests security, rate limiting, and Stripe integration
 */

import { NextRequest } from 'next/server';
import { POST, GET, PUT, DELETE } from '@/app/api/payments/create-intent/route';
import { medusaClient } from '@/lib/medusa';
import { validateCSRF } from '@/lib/csrf-protection';
import { logSecurityEvent } from '@/lib/security-config';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@/lib/medusa', () => ({
  medusaClient: {
    store: {
      cart: {
        retrieve: jest.fn(),
      },
    },
  },
}));

jest.mock('@/lib/csrf-protection', () => ({
  validateCSRF: jest.fn(),
}));

jest.mock('@/lib/security-config', () => ({
  logSecurityEvent: jest.fn(),
  sanitizeLogData: jest.fn((data) => data),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
    },
  }));
});

const mockMedusaClient = medusaClient as jest.Mocked<typeof medusaClient>;
const mockValidateCSRF = validateCSRF as jest.MockedFunction<typeof validateCSRF>;
const mockLogSecurityEvent = logSecurityEvent as jest.MockedFunction<typeof logSecurityEvent>;
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('Payments API Integration Tests', () => {
  let mockStripeInstance: jest.Mocked<Stripe>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Stripe mock
    mockStripeInstance = {
      paymentIntents: {
        create: jest.fn(),
      },
    } as any;
    
    MockedStripe.mockImplementation(() => mockStripeInstance);
    
    // Set environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NODE_ENV = 'test';
    
    // Default mocks
    mockValidateCSRF.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NODE_ENV;
  });

  describe('POST /api/payments/create-intent', () => {
    const mockCart = {
      id: 'cart_123',
      items: [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 1000,
          total: 2000,
        },
      ],
      total: 2000,
      region: {
        id: 'region_1',
        currency_code: 'GBP',
      },
      region_id: 'region_1',
    };

    beforeEach(() => {
      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: mockCart,
      } as any);

      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 2000,
        currency: 'gbp',
      } as any);
    });

    it('should create payment intent successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        client_secret: 'pi_test_123_secret',
        amount: 2000,
        currency: 'gbp',
      });

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'gbp',
        metadata: {
          cart_id: 'cart_123',
          medusa_region_id: 'region_1',
          client_ip: 'unknown',
          created_at: expect.any(String),
        },
        automatic_payment_methods: {
          enabled: true,
        },
        description: 'Strike™ Order - Cart cart_123',
        statement_descriptor: 'STRIKE SHOP',
      });

      expect(mockLogSecurityEvent).toHaveBeenCalledWith('Payment intent created', {
        paymentIntentId: 'pi_test_123',
        amount: 2000,
        currency: 'gbp',
        cartId: 'cart_123',
      });
    });

    it('should handle requests with different currency', async () => {
      const usdCart = {
        ...mockCart,
        region: {
          id: 'region_us',
          currency_code: 'USD',
        },
      };

      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: usdCart,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
        })
      );
    });

    it('should default to GBP when no currency specified', async () => {
      const cartWithoutCurrency = {
        ...mockCart,
        region: null,
      };

      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: cartWithoutCurrency,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'gbp',
        })
      );
    });

    it('should return 503 when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Payment service not configured');
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('Stripe not configured', {
        path: '/api/payments/create-intent',
      });
    });

    it('should return 403 when CSRF validation fails', async () => {
      mockValidateCSRF.mockRejectedValue(new Error('Invalid CSRF token'));

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Security validation failed');
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('CSRF validation failed', {
        path: '/api/payments/create-intent',
        error: 'Invalid CSRF token',
        ip: null,
      });
    });

    it('should handle rate limiting', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'x-csrf-token': 'valid-token',
        },
      });

      // Make multiple requests to trigger rate limit
      const requests = Array.from({ length: 11 }, () => POST(request));
      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      const rateLimitedData = await rateLimitedResponses[0].json();
      expect(rateLimitedData.error).toBe('Too many payment requests. Please try again later.');
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('Payment rate limit exceeded', {
        ip: '192.168.1.1',
      });
    });

    it('should return 400 for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing cart ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Valid cart ID is required');
    });

    it('should return 400 for invalid cart ID format', async () => {
      const testCases = [
        { cartId: null, description: 'null cart ID' },
        { cartId: 123, description: 'numeric cart ID' },
        { cartId: 'a'.repeat(51), description: 'too long cart ID' },
        { cartId: '', description: 'empty cart ID' },
      ];

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
          method: 'POST',
          body: JSON.stringify({ cartId: testCase.cartId }),
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': 'valid-token',
          },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Valid cart ID is required');
      }
    });

    it('should return 404 when cart not found', async () => {
      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: null,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'nonexistent_cart' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Cart not found');
    });

    it('should return 400 for empty cart', async () => {
      const emptyCart = {
        ...mockCart,
        items: [],
      };

      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: emptyCart,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cart is empty');
    });

    it('should return 400 for cart with zero total', async () => {
      const zeroTotalCart = {
        ...mockCart,
        total: 0,
      };

      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: zeroTotalCart,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid cart total');
    });

    it('should return 400 for excessively large payment amount', async () => {
      const highValueCart = {
        ...mockCart,
        total: 50000001, // Exceeds £500,000 limit
      };

      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: highValueCart,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment amount exceeds limit');
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('Excessive payment amount requested', {
        amount: 50000001,
        cartId: 'cart_123',
        ip: '192.168.1.1',
      });
    });

    it('should handle Stripe API errors', async () => {
      mockStripeInstance.paymentIntents.create.mockRejectedValue(
        new Error('Your card was declined.')
      );

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create payment intent');
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('Payment intent creation failed', {
        error: 'Your card was declined.',
        ip: null,
      });
    });

    it('should handle Medusa API errors', async () => {
      mockMedusaClient.store.cart.retrieve.mockRejectedValue(
        new Error('Medusa service unavailable')
      );

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create payment intent');
    });

    it('should include error details in development mode', async () => {
      process.env.NODE_ENV = 'development';

      mockStripeInstance.paymentIntents.create.mockRejectedValue(
        new Error('Detailed error message')
      );

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBe('Detailed error message');
    });

    it('should hide error details in production mode', async () => {
      process.env.NODE_ENV = 'production';

      mockStripeInstance.paymentIntents.create.mockRejectedValue(
        new Error('Detailed error message')
      );

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBe('Internal server error');
    });

    it('should extract client IP from various headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            client_ip: '192.168.1.100',
          }),
        })
      );
    });

    it('should round amount correctly', async () => {
      const cartWithDecimals = {
        ...mockCart,
        total: 19.99,
      };

      mockMedusaClient.store.cart.retrieve.mockResolvedValue({
        cart: cartWithDecimals,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 20, // Rounded from 19.99
        })
      );
    });
  });

  describe('Other HTTP Methods', () => {
    it('should return 405 for GET requests', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });

  describe('Security Features', () => {
    it('should include security metadata in payment intent', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.1',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            cart_id: 'cart_123',
            medusa_region_id: 'region_1',
            client_ip: '203.0.113.1',
            created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          },
        })
      );
    });

    it('should include proper description and statement descriptor', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Strike™ Order - Cart cart_123',
          statement_descriptor: 'STRIKE SHOP',
        })
      );
    });

    it('should enable automatic payment methods', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      await POST(request);

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          automatic_payment_methods: {
            enabled: true,
          },
        })
      );
    });
  });

  describe('Performance', () => {
    it('should complete within acceptable time limits', async () => {
      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ cartId: 'cart_123' }),
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'valid-token',
        },
      });

      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => {
        return new NextRequest('http://localhost:3000/api/payments/create-intent', {
          method: 'POST',
          body: JSON.stringify({ cartId: `cart_${i}` }),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': `192.168.1.${i + 1}`,
            'x-csrf-token': 'valid-token',
          },
        });
      });

      const responses = await Promise.all(requests.map(req => POST(req)));

      // All requests should succeed (within rate limit)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});