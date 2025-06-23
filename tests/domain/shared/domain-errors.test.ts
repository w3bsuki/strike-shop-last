/**
 * Domain Errors Tests
 * Testing all domain error types for proper behavior and error handling
 */

import {
  ValidationError,
  BusinessRuleViolationError,
  DomainError,
} from '@/shared/domain/errors/domain-errors';

describe('DomainError Base Class', () => {
  it('should create domain error with message', () => {
    const error = new DomainError('Test error message');
    
    expect(error.message).toBe('Test error message');
    expect(error.name).toBe('DomainError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });

  it('should include stack trace', () => {
    const error = new DomainError('Test error');
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('DomainError');
  });

  it('should be catchable as Error', () => {
    expect(() => {
      throw new DomainError('Test error');
    }).toThrow(Error);
  });

  it('should maintain proper prototype chain', () => {
    const error = new DomainError('Test error');
    
    expect(error instanceof Error).toBe(true);
    expect(error instanceof DomainError).toBe(true);
    expect(error.constructor.name).toBe('DomainError');
  });
});

describe('ValidationError', () => {
  describe('Constructor', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should accept details object', () => {
      const details = { field: 'email', value: 'invalid-email' };
      const error = new ValidationError('Invalid email', details);
      
      expect(error.message).toBe('Invalid email');
      expect(error.details).toEqual(details);
    });

    it('should work without details', () => {
      const error = new ValidationError('Simple validation error');
      
      expect(error.message).toBe('Simple validation error');
      expect(error.details).toBeUndefined();
    });
  });

  describe('Static Factory Methods', () => {
    describe('required', () => {
      it('should create required field error', () => {
        const error = ValidationError.required('email');
        
        expect(error.message).toBe('email is required');
        expect(error.details).toEqual({ field: 'email' });
        expect(error).toBeInstanceOf(ValidationError);
      });

      it('should handle field names with spaces', () => {
        const error = ValidationError.required('first name');
        
        expect(error.message).toBe('first name is required');
        expect(error.details).toEqual({ field: 'first name' });
      });
    });

    describe('invalidField', () => {
      it('should create invalid field error with value', () => {
        const error = ValidationError.invalidField('age', -5, 'Age must be positive');
        
        expect(error.message).toBe('Age must be positive');
        expect(error.details).toEqual({
          field: 'age',
          value: -5,
          reason: 'Age must be positive',
        });
      });

      it('should work with string values', () => {
        const error = ValidationError.invalidField('email', 'invalid-email', 'Invalid email format');
        
        expect(error.message).toBe('Invalid email format');
        expect(error.details).toEqual({
          field: 'email',
          value: 'invalid-email',
          reason: 'Invalid email format',
        });
      });

      it('should work with complex values', () => {
        const complexValue = { nested: { prop: 'value' } };
        const error = ValidationError.invalidField('data', complexValue, 'Invalid data structure');
        
        expect(error.details?.value).toEqual(complexValue);
      });

      it('should work without reason', () => {
        const error = ValidationError.invalidField('status', 'invalid');
        
        expect(error.message).toBe('Invalid value for field status');
        expect(error.details).toEqual({
          field: 'status',
          value: 'invalid',
          reason: 'Invalid value for field status',
        });
      });
    });

    describe('invalidFormat', () => {
      it('should create invalid format error', () => {
        const error = ValidationError.invalidFormat('phone', '123', 'Phone number must be 10 digits');
        
        expect(error.message).toBe('Phone number must be 10 digits');
        expect(error.details).toEqual({
          field: 'phone',
          value: '123',
          expectedFormat: 'Phone number must be 10 digits',
        });
      });

      it('should work with regex patterns', () => {
        const error = ValidationError.invalidFormat('email', 'test@', '/^[^@]+@[^@]+\\.[^@]+$/');
        
        expect(error.details?.expectedFormat).toBe('/^[^@]+@[^@]+\\.[^@]+$/');
      });
    });

    describe('outOfRange', () => {
      it('should create out of range error with min and max', () => {
        const error = ValidationError.outOfRange('age', 150, 0, 120);
        
        expect(error.message).toBe('age must be between 0 and 120');
        expect(error.details).toEqual({
          field: 'age',
          value: 150,
          min: 0,
          max: 120,
        });
      });

      it('should work with decimal ranges', () => {
        const error = ValidationError.outOfRange('price', 5.5, 1.0, 5.0);
        
        expect(error.message).toBe('price must be between 1 and 5');
        expect(error.details).toEqual({
          field: 'price',
          value: 5.5,
          min: 1.0,
          max: 5.0,
        });
      });

      it('should work with only min value', () => {
        const error = ValidationError.outOfRange('count', -1, 0);
        
        expect(error.message).toBe('count must be at least 0');
        expect(error.details).toEqual({
          field: 'count',
          value: -1,
          min: 0,
          max: undefined,
        });
      });
    });

    describe('tooLong', () => {
      it('should create too long error', () => {
        const longText = 'a'.repeat(101);
        const error = ValidationError.tooLong('description', longText, 100);
        
        expect(error.message).toBe('description cannot exceed 100 characters');
        expect(error.details).toEqual({
          field: 'description',
          value: longText,
          maxLength: 100,
          actualLength: 101,
        });
      });

      it('should work with empty strings', () => {
        const error = ValidationError.tooLong('title', '', 50);
        
        expect(error.details?.actualLength).toBe(0);
      });
    });

    describe('tooShort', () => {
      it('should create too short error', () => {
        const error = ValidationError.tooShort('password', 'abc', 8);
        
        expect(error.message).toBe('password must be at least 8 characters');
        expect(error.details).toEqual({
          field: 'password',
          value: 'abc',
          minLength: 8,
          actualLength: 3,
        });
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const error = ValidationError.invalidField('email', 'test@', 'Invalid email');
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);
      
      expect(parsed.name).toBe('ValidationError');
      expect(parsed.message).toBe('Invalid email');
      expect(parsed.details).toEqual({
        field: 'email',
        value: 'test@',
        reason: 'Invalid email',
      });
    });

    it('should handle errors without details', () => {
      const error = new ValidationError('Simple error');
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);
      
      expect(parsed.details).toBeUndefined();
    });
  });
});

describe('BusinessRuleViolationError', () => {
  describe('Constructor', () => {
    it('should create business rule error with rule and message', () => {
      const error = new BusinessRuleViolationError('insufficient_funds', 'Insufficient account balance');
      
      expect(error.message).toBe('Insufficient account balance');
      expect(error.rule).toBe('insufficient_funds');
      expect(error.name).toBe('BusinessRuleViolationError');
      expect(error).toBeInstanceOf(BusinessRuleViolationError);
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should accept context object', () => {
      const context = { balance: 100, requestedAmount: 150 };
      const error = new BusinessRuleViolationError(
        'insufficient_funds',
        'Insufficient balance',
        context
      );
      
      expect(error.context).toEqual(context);
    });

    it('should work without context', () => {
      const error = new BusinessRuleViolationError('rule_violation', 'Rule violated');
      
      expect(error.context).toBeUndefined();
    });
  });

  describe('Static Factory Method', () => {
    describe('create', () => {
      it('should create business rule error', () => {
        const error = BusinessRuleViolationError.create(
          'max_quantity_exceeded',
          'Cannot add more than 10 items',
          { maxQuantity: 10, requestedQuantity: 15 }
        );
        
        expect(error.rule).toBe('max_quantity_exceeded');
        expect(error.message).toBe('Cannot add more than 10 items');
        expect(error.context).toEqual({ maxQuantity: 10, requestedQuantity: 15 });
      });

      it('should work without context', () => {
        const error = BusinessRuleViolationError.create('rule_violation', 'Rule violated');
        
        expect(error.rule).toBe('rule_violation');
        expect(error.message).toBe('Rule violated');
        expect(error.context).toBeUndefined();
      });
    });
  });

  describe('Common Business Rules', () => {
    it('should handle inventory management rules', () => {
      const error = BusinessRuleViolationError.create(
        'insufficient_inventory',
        'Not enough items in stock',
        { available: 5, requested: 10 }
      );
      
      expect(error.rule).toBe('insufficient_inventory');
      expect(error.context?.available).toBe(5);
      expect(error.context?.requested).toBe(10);
    });

    it('should handle pricing rules', () => {
      const error = BusinessRuleViolationError.create(
        'minimum_order_not_met',
        'Order must be at least $50',
        { minimumAmount: 5000, currentAmount: 3000 }
      );
      
      expect(error.rule).toBe('minimum_order_not_met');
    });

    it('should handle user access rules', () => {
      const error = BusinessRuleViolationError.create(
        'access_denied',
        'User does not have permission to perform this action',
        { userId: 'user_123', requiredRole: 'admin', userRole: 'customer' }
      );
      
      expect(error.rule).toBe('access_denied');
    });

    it('should handle temporal rules', () => {
      const error = BusinessRuleViolationError.create(
        'outside_business_hours',
        'Orders can only be placed during business hours',
        { 
          currentTime: '22:00',
          businessHours: { start: '09:00', end: '17:00' }
        }
      );
      
      expect(error.rule).toBe('outside_business_hours');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const error = BusinessRuleViolationError.create(
        'test_rule',
        'Test message',
        { data: 'test' }
      );
      
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);
      
      expect(parsed.name).toBe('BusinessRuleViolationError');
      expect(parsed.message).toBe('Test message');
      expect(parsed.rule).toBe('test_rule');
      expect(parsed.context).toEqual({ data: 'test' });
    });

    it('should handle errors without context', () => {
      const error = BusinessRuleViolationError.create('test_rule', 'Test message');
      
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);
      
      expect(parsed.context).toBeUndefined();
    });
  });
});

describe('Error Hierarchy', () => {
  it('should maintain proper inheritance chain', () => {
    const validationError = new ValidationError('Validation failed');
    const businessError = new BusinessRuleViolationError('rule', 'Business rule failed');
    
    // All should be instances of Error
    expect(validationError instanceof Error).toBe(true);
    expect(businessError instanceof Error).toBe(true);
    
    // All should be instances of DomainError
    expect(validationError instanceof DomainError).toBe(true);
    expect(businessError instanceof DomainError).toBe(true);
    
    // Should be instances of their specific types
    expect(validationError instanceof ValidationError).toBe(true);
    expect(businessError instanceof BusinessRuleViolationError).toBe(true);
    
    // Should not be instances of each other
    expect(validationError instanceof BusinessRuleViolationError).toBe(false);
    expect(businessError instanceof ValidationError).toBe(false);
  });

  it('should work with try-catch blocks', () => {
    const errors: Error[] = [];
    
    try {
      throw new ValidationError('Validation error');
    } catch (error) {
      errors.push(error as Error);
    }
    
    try {
      throw new BusinessRuleViolationError('rule', 'Business error');
    } catch (error) {
      errors.push(error as Error);
    }
    
    expect(errors).toHaveLength(2);
    expect(errors[0]).toBeInstanceOf(ValidationError);
    expect(errors[1]).toBeInstanceOf(BusinessRuleViolationError);
  });

  it('should work with instanceof checks in catch blocks', () => {
    const handleError = (error: Error) => {
      if (error instanceof ValidationError) {
        return 'validation';
      } else if (error instanceof BusinessRuleViolationError) {
        return 'business';
      } else if (error instanceof DomainError) {
        return 'domain';
      } else {
        return 'generic';
      }
    };
    
    expect(handleError(new ValidationError('test'))).toBe('validation');
    expect(handleError(new BusinessRuleViolationError('rule', 'test'))).toBe('business');
    expect(handleError(new DomainError('test'))).toBe('domain');
    expect(handleError(new Error('test'))).toBe('generic');
  });
});

describe('Error Context and Details', () => {
  it('should preserve complex objects in context', () => {
    const complexContext = {
      user: { id: 'user_123', role: 'admin' },
      request: { method: 'POST', path: '/api/orders' },
      timestamp: new Date('2024-01-01T00:00:00Z'),
      metadata: { source: 'web', version: '1.0' },
    };
    
    const error = BusinessRuleViolationError.create(
      'test_rule',
      'Test error',
      complexContext
    );
    
    expect(error.context).toEqual(complexContext);
  });

  it('should preserve arrays in context', () => {
    const context = {
      invalidFields: ['email', 'password'],
      validFields: ['name', 'phone'],
      errors: [
        { field: 'email', message: 'Invalid format' },
        { field: 'password', message: 'Too short' },
      ],
    };
    
    const error = BusinessRuleViolationError.create('validation_failed', 'Multiple validation errors', context);
    
    expect(error.context?.invalidFields).toEqual(['email', 'password']);
    expect(error.context?.errors).toHaveLength(2);
  });

  it('should handle null and undefined values in context', () => {
    const context = {
      nullValue: null,
      undefinedValue: undefined,
      emptyString: '',
      zeroNumber: 0,
      falseBoolean: false,
    };
    
    const error = BusinessRuleViolationError.create('test_rule', 'Test', context);
    
    expect(error.context?.nullValue).toBeNull();
    expect(error.context?.undefinedValue).toBeUndefined();
    expect(error.context?.emptyString).toBe('');
    expect(error.context?.zeroNumber).toBe(0);
    expect(error.context?.falseBoolean).toBe(false);
  });
});

describe('Error Messages', () => {
  it('should create meaningful error messages', () => {
    const errors = [
      ValidationError.required('email'),
      ValidationError.invalidFormat('phone', '123', '10-digit format'),
      ValidationError.outOfRange('age', 150, 0, 120),
      ValidationError.tooLong('description', 'x'.repeat(101), 100),
      ValidationError.tooShort('password', 'abc', 8),
      BusinessRuleViolationError.create('insufficient_funds', 'Insufficient balance'),
    ];
    
    expect(errors[0].message).toBe('email is required');
    expect(errors[1].message).toBe('10-digit format');
    expect(errors[2].message).toBe('age must be between 0 and 120');
    expect(errors[3].message).toBe('description cannot exceed 100 characters');
    expect(errors[4].message).toBe('password must be at least 8 characters');
    expect(errors[5].message).toBe('Insufficient balance');
  });

  it('should create helpful default messages', () => {
    const error = ValidationError.invalidField('status', 'unknown');
    expect(error.message).toBe('Invalid value for field status');
  });
});