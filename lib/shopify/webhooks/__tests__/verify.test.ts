/**
 * Tests for Shopify webhook verification
 */

import { createHmac } from 'crypto';
import {
  verifyWebhookSignature,
  checkWebhookRateLimit,
  parseWebhookHeaders,
  validateWebhookPayload,
  createWebhookError
} from '../verify';
import type { ShopifyWebhookHeaders } from '../../types/webhooks';

describe('Webhook Verification', () => {
  const secret = 'test-webhook-secret';
  const payload = JSON.stringify({
    id: 123456,
    email: 'test@example.com',
    created_at: '2024-01-20T10:00:00Z'
  });

  // Helper to create valid signature
  const createSignature = (body: string, webhookSecret: string) => {
    return createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('base64');
  };

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const signature = createSignature(payload, secret);
      const result = verifyWebhookSignature(payload, signature, secret);
      
      expect(result.verified).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid signature', () => {
      const invalidSignature = createSignature(payload, 'wrong-secret');
      const result = verifyWebhookSignature(payload, invalidSignature, secret);
      
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should reject missing signature', () => {
      const result = verifyWebhookSignature(payload, null, secret);
      
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Missing webhook signature header');
    });

    it('should reject missing secret', () => {
      const signature = createSignature(payload, secret);
      const result = verifyWebhookSignature(payload, signature, null);
      
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Webhook secret not configured');
    });

    it('should reject empty payload', () => {
      const result = verifyWebhookSignature('', 'signature', secret);
      
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Empty webhook body');
    });

    it('should handle Buffer payload', () => {
      const signature = createSignature(payload, secret);
      const buffer = Buffer.from(payload, 'utf8');
      const result = verifyWebhookSignature(buffer, signature, secret);
      
      expect(result.verified).toBe(true);
    });

    it('should reject old webhooks', () => {
      const signature = createSignature(payload, secret);
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      
      const headers: Partial<ShopifyWebhookHeaders> = {
        'x-shopify-triggered-at': oldTimestamp
      };
      
      const result = verifyWebhookSignature(payload, signature, secret, headers);
      
      expect(result.verified).toBe(false);
      expect(result.error).toMatch(/Webhook is too old/);
    });

    it('should include metadata in successful verification', () => {
      const signature = createSignature(payload, secret);
      const headers: Partial<ShopifyWebhookHeaders> = {
        'x-shopify-topic': 'orders/create',
        'x-shopify-shop-domain': 'test.myshopify.com'
      };
      
      const result = verifyWebhookSignature(payload, signature, secret, headers);
      
      expect(result.verified).toBe(true);
      expect(result.topic).toBe('orders/create');
      expect(result.domain).toBe('test.myshopify.com');
    });
  });

  describe('checkWebhookRateLimit', () => {
    it('should allow webhooks within rate limit', () => {
      const shopDomain = 'test-shop.myshopify.com';
      
      // First few requests should pass
      for (let i = 0; i < 5; i++) {
        expect(checkWebhookRateLimit(shopDomain)).toBe(true);
      }
    });

    it('should track different shops separately', () => {
      const shop1 = 'shop1.myshopify.com';
      const shop2 = 'shop2.myshopify.com';
      
      expect(checkWebhookRateLimit(shop1)).toBe(true);
      expect(checkWebhookRateLimit(shop2)).toBe(true);
    });

    // Note: Testing rate limit exceeded would require mocking time or
    // sending 100+ requests, which is not practical in unit tests
  });

  describe('parseWebhookHeaders', () => {
    it('should parse webhook headers correctly', () => {
      const headers = new Headers({
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'test-signature',
        'x-shopify-shop-domain': 'test.myshopify.com',
        'x-shopify-api-version': '2024-01',
        'x-shopify-webhook-id': 'webhook-123',
        'x-shopify-triggered-at': '2024-01-20T10:00:00Z',
        'other-header': 'ignored'
      });
      
      const parsed = parseWebhookHeaders(headers);
      
      expect(parsed).toEqual({
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'test-signature',
        'x-shopify-shop-domain': 'test.myshopify.com',
        'x-shopify-api-version': '2024-01',
        'x-shopify-webhook-id': 'webhook-123',
        'x-shopify-triggered-at': '2024-01-20T10:00:00Z'
      });
    });

    it('should handle missing headers', () => {
      const headers = new Headers({
        'x-shopify-topic': 'orders/create'
      });
      
      const parsed = parseWebhookHeaders(headers);
      
      expect(parsed).toEqual({
        'x-shopify-topic': 'orders/create'
      });
    });
  });

  describe('validateWebhookPayload', () => {
    it('should validate valid payload with id', () => {
      const validPayload = { id: 123, data: 'test' };
      expect(validateWebhookPayload(validPayload)).toBe(true);
    });

    it('should validate inventory level payload', () => {
      const inventoryPayload = { inventory_item_id: 456, available: 10 };
      expect(validateWebhookPayload(inventoryPayload)).toBe(true);
    });

    it('should reject null payload', () => {
      expect(validateWebhookPayload(null)).toBe(false);
    });

    it('should reject non-object payload', () => {
      expect(validateWebhookPayload('string')).toBe(false);
      expect(validateWebhookPayload(123)).toBe(false);
      expect(validateWebhookPayload([])).toBe(false);
    });

    it('should reject payload without id', () => {
      const invalidPayload = { data: 'test' };
      expect(validateWebhookPayload(invalidPayload)).toBe(false);
    });
  });

  describe('createWebhookError', () => {
    it('should create proper error with code', () => {
      const error = createWebhookError('Test error', 'INVALID_SIGNATURE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('WebhookVerificationError');
      expect(error.code).toBe('INVALID_SIGNATURE');
    });
  });
});

// Integration test example
describe('Webhook Verification Integration', () => {
  it('should handle complete webhook verification flow', () => {
    const secret = 'integration-test-secret';
    const orderPayload = {
      id: 5555555,
      email: 'customer@example.com',
      total_price: '100.00',
      currency: 'USD',
      line_items: [
        {
          id: 1111,
          title: 'Test Product',
          quantity: 1,
          price: '100.00'
        }
      ]
    };
    
    const body = JSON.stringify(orderPayload);
    const signature = createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');
    
    const headers: Partial<ShopifyWebhookHeaders> = {
      'x-shopify-topic': 'orders/create',
      'x-shopify-shop-domain': 'integration-test.myshopify.com',
      'x-shopify-triggered-at': new Date().toISOString()
    };
    
    // Verify signature
    const verifyResult = verifyWebhookSignature(body, signature, secret, headers);
    expect(verifyResult.verified).toBe(true);
    expect(verifyResult.topic).toBe('orders/create');
    
    // Check rate limit
    expect(checkWebhookRateLimit(headers['x-shopify-shop-domain']!)).toBe(true);
    
    // Validate payload
    const parsed = JSON.parse(body);
    expect(validateWebhookPayload(parsed)).toBe(true);
  });
});