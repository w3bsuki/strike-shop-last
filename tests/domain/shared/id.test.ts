/**
 * ID Value Objects Tests
 * Testing all ID value objects for proper validation and behavior
 */

import { Id } from '@/shared/domain/value-objects/id';

// Test ID classes
class ProductId extends Id {}
class CartId extends Id {}
class UserId extends Id {}
class OrderId extends Id {}

describe('Id Value Object', () => {
  describe('Constructor', () => {
    it('should create ID with valid value', () => {
      const id = new ProductId('prod_123');
      expect(id.value).toBe('prod_123');
    });

    it('should throw error for empty string', () => {
      expect(() => new ProductId('')).toThrow('ID cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => new ProductId('   ')).toThrow('ID cannot be empty');
    });

    it('should throw error for null', () => {
      expect(() => new ProductId(null as any)).toThrow('ID cannot be empty');
    });

    it('should throw error for undefined', () => {
      expect(() => new ProductId(undefined as any)).toThrow('ID cannot be empty');
    });

    it('should trim whitespace from valid ID', () => {
      const id = new ProductId('  prod_123  ');
      expect(id.value).toBe('prod_123');
    });

    it('should handle IDs with special characters', () => {
      const id = new ProductId('prod_123-abc.def');
      expect(id.value).toBe('prod_123-abc.def');
    });

    it('should handle UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = new ProductId(uuid);
      expect(id.value).toBe(uuid);
    });
  });

  describe('generate', () => {
    it('should generate unique IDs', () => {
      const id1 = ProductId.generate();
      const id2 = ProductId.generate();
      
      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should generate IDs with correct format', () => {
      const id = ProductId.generate();
      
      // Generated IDs should be UUIDs or similar format
      expect(id.value).toMatch(/^[a-zA-Z0-9\-_]+$/);
      expect(id.value.length).toBeGreaterThan(10);
    });

    it('should generate different IDs for different classes', () => {
      const productId = ProductId.generate();
      const cartId = CartId.generate();
      const userId = UserId.generate();
      
      expect(productId.value).not.toBe(cartId.value);
      expect(cartId.value).not.toBe(userId.value);
      expect(productId.value).not.toBe(userId.value);
    });
  });

  describe('equals', () => {
    it('should return true for same ID values', () => {
      const id1 = new ProductId('prod_123');
      const id2 = new ProductId('prod_123');
      
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ID values', () => {
      const id1 = new ProductId('prod_123');
      const id2 = new ProductId('prod_456');
      
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false for different ID types with same value', () => {
      const productId = new ProductId('123');
      const cartId = new CartId('123');
      
      expect(productId.equals(cartId as any)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      const id1 = new ProductId('prod_123');
      const id2 = new ProductId('PROD_123');
      
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the ID value', () => {
      const id = new ProductId('prod_123');
      expect(id.toString()).toBe('prod_123');
    });

    it('should work with string concatenation', () => {
      const id = new ProductId('prod_123');
      const message = `Product ID: ${id}`;
      expect(message).toBe('Product ID: prod_123');
    });
  });

  describe('toJSON', () => {
    it('should serialize to string', () => {
      const id = new ProductId('prod_123');
      expect(id.toJSON()).toBe('prod_123');
    });

    it('should work with JSON.stringify', () => {
      const id = new ProductId('prod_123');
      const json = JSON.stringify({ id });
      expect(json).toBe('{"id":"prod_123"}');
    });
  });

  describe('fromString', () => {
    it('should create ID from string', () => {
      const id = ProductId.fromString('prod_123');
      expect(id.value).toBe('prod_123');
    });

    it('should throw error for empty string', () => {
      expect(() => ProductId.fromString('')).toThrow('ID cannot be empty');
    });

    it('should trim whitespace', () => {
      const id = ProductId.fromString('  prod_123  ');
      expect(id.value).toBe('prod_123');
    });
  });

  describe('Specific ID Types', () => {
    it('should work with ProductId', () => {
      const id = new ProductId('prod_123');
      expect(id).toBeInstanceOf(ProductId);
      expect(id).toBeInstanceOf(Id);
    });

    it('should work with CartId', () => {
      const id = new CartId('cart_456');
      expect(id).toBeInstanceOf(CartId);
      expect(id).toBeInstanceOf(Id);
    });

    it('should work with UserId', () => {
      const id = new UserId('user_789');
      expect(id).toBeInstanceOf(UserId);
      expect(id).toBeInstanceOf(Id);
    });

    it('should work with OrderId', () => {
      const id = new OrderId('order_101');
      expect(id).toBeInstanceOf(OrderId);
      expect(id).toBeInstanceOf(Id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long IDs', () => {
      const longId = 'a'.repeat(1000);
      const id = new ProductId(longId);
      expect(id.value).toBe(longId);
    });

    it('should handle IDs with Unicode characters', () => {
      const unicodeId = 'prod_123_测试_🎉';
      const id = new ProductId(unicodeId);
      expect(id.value).toBe(unicodeId);
    });

    it('should handle numeric strings', () => {
      const id = new ProductId('123456789');
      expect(id.value).toBe('123456789');
    });

    it('should handle IDs with newlines (should be trimmed)', () => {
      const id = new ProductId('prod_123\n');
      expect(id.value).toBe('prod_123');
    });
  });

  describe('Performance', () => {
    it('should generate IDs quickly', () => {
      const start = Date.now();
      const ids = Array.from({ length: 1000 }, () => ProductId.generate());
      const end = Date.now();
      
      expect(end - start).toBeLessThan(1000); // Should take less than 1 second
      expect(ids.length).toBe(1000);
      
      // All IDs should be unique
      const uniqueIds = new Set(ids.map(id => id.value));
      expect(uniqueIds.size).toBe(1000);
    });

    it('should compare IDs quickly', () => {
      const id1 = new ProductId('prod_123');
      const id2 = new ProductId('prod_123');
      const id3 = new ProductId('prod_456');
      
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        id1.equals(id2);
        id1.equals(id3);
      }
      const end = Date.now();
      
      expect(end - start).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Immutability', () => {
    it('should be immutable', () => {
      const id = new ProductId('prod_123');
      
      // TypeScript should prevent this at compile time,
      // but let's test runtime behavior
      expect(() => {
        (id as any).value = 'modified';
      }).not.toThrow(); // The assignment might not throw but should not change the value
      
      expect(id.value).toBe('prod_123');
    });

    it('should not allow modification of generated IDs', () => {
      const id = ProductId.generate();
      const originalValue = id.value;
      
      (id as any).value = 'modified';
      expect(id.value).toBe(originalValue);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety between different ID types', () => {
      const productId = new ProductId('123');
      const cartId = new CartId('123');
      
      // These should be different types
      expect(productId.constructor).not.toBe(cartId.constructor);
    });

    it('should work correctly with instanceof checks', () => {
      const productId = new ProductId('123');
      const cartId = new CartId('123');
      
      expect(productId instanceof ProductId).toBe(true);
      expect(productId instanceof CartId).toBe(false);
      expect(cartId instanceof CartId).toBe(true);
      expect(cartId instanceof ProductId).toBe(false);
      
      // Both should be instances of base Id class
      expect(productId instanceof Id).toBe(true);
      expect(cartId instanceof Id).toBe(true);
    });
  });
});