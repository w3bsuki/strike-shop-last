/**
 * Money Value Object Tests
 * Comprehensive test suite for Money, Currency, and MoneyRange value objects
 * Target: 100% code coverage for domain entities
 */

import {
  Money,
  Currency,
  MoneyRange,
  MoneyUtils,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@/shared/domain/value-objects/money';

describe('Currency Value Object', () => {
  describe('Constructor', () => {
    it('should create currency with valid code', () => {
      const usd = new Currency('USD');
      expect(usd.code).toBe('USD');
      expect(usd.symbol).toBe('$');
      expect(usd.decimals).toBe(2);
      expect(usd.name).toBe('US Dollar');
    });

    it('should throw error for invalid currency code', () => {
      expect(() => new Currency('INVALID' as SupportedCurrency)).toThrow(
        'Unsupported currency: INVALID'
      );
    });

    it('should create all supported currencies', () => {
      Object.keys(SUPPORTED_CURRENCIES).forEach((code) => {
        const currency = new Currency(code as SupportedCurrency);
        expect(currency.code).toBe(code);
        expect(currency.symbol).toBe(SUPPORTED_CURRENCIES[code].symbol);
        expect(currency.decimals).toBe(SUPPORTED_CURRENCIES[code].decimals);
        expect(currency.name).toBe(SUPPORTED_CURRENCIES[code].name);
      });
    });
  });

  describe('Static Constants', () => {
    it('should provide static currency constants', () => {
      expect(Currency.USD.code).toBe('USD');
      expect(Currency.EUR.code).toBe('EUR');
      expect(Currency.GBP.code).toBe('GBP');
      expect(Currency.JPY.code).toBe('JPY');
      expect(Currency.CAD.code).toBe('CAD');
      expect(Currency.AUD.code).toBe('AUD');
    });
  });

  describe('fromString', () => {
    it('should create currency from string', () => {
      const usd = Currency.fromString('usd');
      expect(usd.code).toBe('USD');
    });

    it('should handle uppercase string', () => {
      const eur = Currency.fromString('EUR');
      expect(eur.code).toBe('EUR');
    });
  });

  describe('equals', () => {
    it('should return true for same currency', () => {
      const usd1 = new Currency('USD');
      const usd2 = new Currency('USD');
      expect(usd1.equals(usd2)).toBe(true);
    });

    it('should return false for different currencies', () => {
      const usd = new Currency('USD');
      const eur = new Currency('EUR');
      expect(usd.equals(eur)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return currency code', () => {
      const usd = new Currency('USD');
      expect(usd.toString()).toBe('USD');
    });
  });
});

describe('Money Value Object', () => {
  describe('Constructor', () => {
    it('should create money with valid amount and currency', () => {
      const money = new Money(1000, Currency.USD);
      expect(money.amount).toBe(1000);
      expect(money.currency.code).toBe('USD');
      expect(money.decimalAmount).toBe(10.00);
    });

    it('should throw error for non-integer amount', () => {
      expect(() => new Money(10.5, Currency.USD)).toThrow(
        'Amount must be an integer representing smallest currency unit'
      );
    });

    it('should throw error for invalid amount', () => {
      expect(() => new Money(NaN, Currency.USD)).toThrow('Invalid amount: NaN');
      expect(() => new Money(Infinity, Currency.USD)).toThrow('Invalid amount: Infinity');
    });
  });

  describe('fromDecimal', () => {
    it('should create money from decimal amount', () => {
      const money = Money.fromDecimal(19.99, Currency.USD);
      expect(money.amount).toBe(1999);
      expect(money.decimalAmount).toBe(19.99);
    });

    it('should handle JPY (zero decimals)', () => {
      const money = Money.fromDecimal(100, Currency.JPY);
      expect(money.amount).toBe(100);
      expect(money.decimalAmount).toBe(100);
    });

    it('should round correctly', () => {
      const money = Money.fromDecimal(19.996, Currency.USD);
      expect(money.amount).toBe(2000); // Rounds to 20.00
    });

    it('should throw error for invalid decimal amount', () => {
      expect(() => Money.fromDecimal(NaN, Currency.USD)).toThrow(
        'Invalid decimal amount: NaN'
      );
    });
  });

  describe('fromString', () => {
    it('should create money from string amount', () => {
      const money = Money.fromString('19.99', Currency.USD);
      expect(money.amount).toBe(1999);
      expect(money.decimalAmount).toBe(19.99);
    });

    it('should throw error for invalid string', () => {
      expect(() => Money.fromString('invalid', Currency.USD)).toThrow(
        'Invalid amount string: invalid'
      );
    });
  });

  describe('zero', () => {
    it('should create zero money', () => {
      const zero = Money.zero(Currency.USD);
      expect(zero.amount).toBe(0);
      expect(zero.isZero).toBe(true);
    });
  });

  describe('Properties', () => {
    const money = new Money(1500, Currency.USD);

    it('should return correct amount', () => {
      expect(money.amount).toBe(1500);
    });

    it('should return correct decimal amount', () => {
      expect(money.decimalAmount).toBe(15.00);
    });

    it('should return correct currency', () => {
      expect(money.currency.code).toBe('USD');
    });

    it('should check if zero', () => {
      expect(money.isZero).toBe(false);
      expect(Money.zero(Currency.USD).isZero).toBe(true);
    });

    it('should check if positive', () => {
      expect(money.isPositive).toBe(true);
      expect(new Money(-1000, Currency.USD).isPositive).toBe(false);
      expect(Money.zero(Currency.USD).isPositive).toBe(false);
    });

    it('should check if negative', () => {
      expect(money.isNegative).toBe(false);
      expect(new Money(-1000, Currency.USD).isNegative).toBe(true);
      expect(Money.zero(Currency.USD).isNegative).toBe(false);
    });
  });

  describe('Arithmetic Operations', () => {
    const money1 = new Money(1000, Currency.USD);
    const money2 = new Money(500, Currency.USD);
    const eurMoney = new Money(1000, Currency.EUR);

    describe('add', () => {
      it('should add money with same currency', () => {
        const result = money1.add(money2);
        expect(result.amount).toBe(1500);
        expect(result.currency.code).toBe('USD');
      });

      it('should throw error for different currencies', () => {
        expect(() => money1.add(eurMoney)).toThrow(
          'Currency mismatch: USD vs EUR'
        );
      });
    });

    describe('subtract', () => {
      it('should subtract money with same currency', () => {
        const result = money1.subtract(money2);
        expect(result.amount).toBe(500);
        expect(result.currency.code).toBe('USD');
      });

      it('should throw error for different currencies', () => {
        expect(() => money1.subtract(eurMoney)).toThrow(
          'Currency mismatch: USD vs EUR'
        );
      });
    });

    describe('multiply', () => {
      it('should multiply by positive factor', () => {
        const result = money1.multiply(2);
        expect(result.amount).toBe(2000);
      });

      it('should multiply by decimal factor', () => {
        const result = money1.multiply(1.5);
        expect(result.amount).toBe(1500);
      });

      it('should round correctly', () => {
        const result = money1.multiply(1.555);
        expect(result.amount).toBe(1555); // Rounded
      });

      it('should throw error for infinite factor', () => {
        expect(() => money1.multiply(Infinity)).toThrow('Factor must be finite');
      });
    });

    describe('divide', () => {
      it('should divide by positive divisor', () => {
        const result = money1.divide(2);
        expect(result.amount).toBe(500);
      });

      it('should round correctly', () => {
        const result = new Money(1001, Currency.USD).divide(3);
        expect(result.amount).toBe(334); // Rounded
      });

      it('should throw error for zero divisor', () => {
        expect(() => money1.divide(0)).toThrow('Cannot divide by zero');
      });

      it('should throw error for infinite divisor', () => {
        expect(() => money1.divide(Infinity)).toThrow('Divisor must be finite');
      });
    });
  });

  describe('Comparison Operations', () => {
    const money1 = new Money(1000, Currency.USD);
    const money2 = new Money(500, Currency.USD);
    const money3 = new Money(1000, Currency.USD);
    const eurMoney = new Money(1000, Currency.EUR);

    describe('equals', () => {
      it('should return true for equal money', () => {
        expect(money1.equals(money3)).toBe(true);
      });

      it('should return false for different amounts', () => {
        expect(money1.equals(money2)).toBe(false);
      });

      it('should return false for different currencies', () => {
        expect(money1.equals(eurMoney)).toBe(false);
      });
    });

    describe('greaterThan', () => {
      it('should return true when amount is greater', () => {
        expect(money1.greaterThan(money2)).toBe(true);
      });

      it('should return false when amount is equal or less', () => {
        expect(money1.greaterThan(money3)).toBe(false);
        expect(money2.greaterThan(money1)).toBe(false);
      });

      it('should throw error for different currencies', () => {
        expect(() => money1.greaterThan(eurMoney)).toThrow(
          'Currency mismatch: USD vs EUR'
        );
      });
    });

    describe('greaterThanOrEqual', () => {
      it('should return true when amount is greater or equal', () => {
        expect(money1.greaterThanOrEqual(money2)).toBe(true);
        expect(money1.greaterThanOrEqual(money3)).toBe(true);
      });

      it('should return false when amount is less', () => {
        expect(money2.greaterThanOrEqual(money1)).toBe(false);
      });
    });

    describe('lessThan', () => {
      it('should return true when amount is less', () => {
        expect(money2.lessThan(money1)).toBe(true);
      });

      it('should return false when amount is equal or greater', () => {
        expect(money1.lessThan(money3)).toBe(false);
        expect(money1.lessThan(money2)).toBe(false);
      });
    });

    describe('lessThanOrEqual', () => {
      it('should return true when amount is less or equal', () => {
        expect(money2.lessThanOrEqual(money1)).toBe(true);
        expect(money1.lessThanOrEqual(money3)).toBe(true);
      });

      it('should return false when amount is greater', () => {
        expect(money1.lessThanOrEqual(money2)).toBe(false);
      });
    });
  });

  describe('Other Operations', () => {
    describe('abs', () => {
      it('should return absolute value', () => {
        const negative = new Money(-1000, Currency.USD);
        const result = negative.abs();
        expect(result.amount).toBe(1000);
      });

      it('should return same value for positive amount', () => {
        const positive = new Money(1000, Currency.USD);
        const result = positive.abs();
        expect(result.amount).toBe(1000);
      });
    });

    describe('negate', () => {
      it('should negate positive amount', () => {
        const positive = new Money(1000, Currency.USD);
        const result = positive.negate();
        expect(result.amount).toBe(-1000);
      });

      it('should negate negative amount', () => {
        const negative = new Money(-1000, Currency.USD);
        const result = negative.negate();
        expect(result.amount).toBe(1000);
      });
    });
  });

  describe('Formatting', () => {
    describe('format', () => {
      it('should format USD correctly', () => {
        const money = new Money(1999, Currency.USD);
        const formatted = money.format('en-US');
        expect(formatted).toBe('$19.99');
      });

      it('should format EUR correctly', () => {
        const money = new Money(1999, Currency.EUR);
        const formatted = money.format('en-DE');
        expect(formatted).toContain('19.99');
      });

      it('should format JPY correctly', () => {
        const money = new Money(1999, Currency.JPY);
        const formatted = money.format('ja-JP');
        expect(formatted).toContain('1,999');
      });

      it('should use default locale when none provided', () => {
        const money = new Money(1999, Currency.USD);
        const formatted = money.format();
        expect(formatted).toBe('$19.99');
      });
    });

    describe('formatAmount', () => {
      it('should format amount without currency symbol', () => {
        const money = new Money(1999, Currency.USD);
        const formatted = money.formatAmount('en-US');
        expect(formatted).toBe('19.99');
      });
    });

    describe('toString', () => {
      it('should return formatted string', () => {
        const money = new Money(1999, Currency.USD);
        expect(money.toString()).toBe('$19.99');
      });
    });
  });

  describe('Serialization', () => {
    describe('toJSON', () => {
      it('should serialize to JSON', () => {
        const money = new Money(1999, Currency.USD);
        const json = money.toJSON();
        expect(json).toEqual({
          amount: 1999,
          currency: 'USD',
        });
      });
    });

    describe('fromJSON', () => {
      it('should deserialize from JSON', () => {
        const json = { amount: 1999, currency: 'USD' };
        const money = Money.fromJSON(json);
        expect(money.amount).toBe(1999);
        expect(money.currency.code).toBe('USD');
      });
    });
  });
});

describe('MoneyRange Value Object', () => {
  const min = new Money(1000, Currency.USD);
  const max = new Money(2000, Currency.USD);
  const range = new MoneyRange(min, max);

  describe('Constructor', () => {
    it('should create range with valid min and max', () => {
      expect(range.min.equals(min)).toBe(true);
      expect(range.max.equals(max)).toBe(true);
      expect(range.currency.code).toBe('USD');
    });

    it('should throw error for different currencies', () => {
      const eurMin = new Money(1000, Currency.EUR);
      expect(() => new MoneyRange(eurMin, max)).toThrow(
        'Min and max must have the same currency'
      );
    });

    it('should throw error when min > max', () => {
      const bigMin = new Money(3000, Currency.USD);
      expect(() => new MoneyRange(bigMin, max)).toThrow(
        'Min cannot be greater than max'
      );
    });
  });

  describe('contains', () => {
    it('should return true for amount within range', () => {
      const amount = new Money(1500, Currency.USD);
      expect(range.contains(amount)).toBe(true);
    });

    it('should return true for amount at boundaries', () => {
      expect(range.contains(min)).toBe(true);
      expect(range.contains(max)).toBe(true);
    });

    it('should return false for amount outside range', () => {
      const tooLow = new Money(500, Currency.USD);
      const tooHigh = new Money(3000, Currency.USD);
      expect(range.contains(tooLow)).toBe(false);
      expect(range.contains(tooHigh)).toBe(false);
    });
  });

  describe('overlaps', () => {
    it('should return true for overlapping ranges', () => {
      const otherRange = new MoneyRange(
        new Money(1500, Currency.USD),
        new Money(2500, Currency.USD)
      );
      expect(range.overlaps(otherRange)).toBe(true);
    });

    it('should return false for non-overlapping ranges', () => {
      const otherRange = new MoneyRange(
        new Money(3000, Currency.USD),
        new Money(4000, Currency.USD)
      );
      expect(range.overlaps(otherRange)).toBe(false);
    });

    it('should return true for touching ranges', () => {
      const otherRange = new MoneyRange(
        new Money(2000, Currency.USD),
        new Money(3000, Currency.USD)
      );
      expect(range.overlaps(otherRange)).toBe(true);
    });
  });

  describe('format', () => {
    it('should format range correctly', () => {
      const formatted = range.format('en-US');
      expect(formatted).toBe('$10.00 - $20.00');
    });
  });

  describe('toString', () => {
    it('should return formatted string', () => {
      expect(range.toString()).toBe('$10.00 - $20.00');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const json = range.toJSON();
      expect(json).toEqual({
        min: { amount: 1000, currency: 'USD' },
        max: { amount: 2000, currency: 'USD' },
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        min: { amount: 1000, currency: 'USD' },
        max: { amount: 2000, currency: 'USD' },
      };
      const deserialized = MoneyRange.fromJSON(json);
      expect(deserialized.min.amount).toBe(1000);
      expect(deserialized.max.amount).toBe(2000);
    });
  });
});

describe('MoneyUtils', () => {
  const amounts = [
    new Money(1000, Currency.USD),
    new Money(2000, Currency.USD),
    new Money(3000, Currency.USD),
  ];

  describe('sum', () => {
    it('should sum array of money amounts', () => {
      const result = MoneyUtils.sum(amounts);
      expect(result.amount).toBe(6000);
    });

    it('should throw error for empty array', () => {
      expect(() => MoneyUtils.sum([])).toThrow('Cannot sum empty array');
    });

    it('should throw error for different currencies', () => {
      const mixedAmounts = [
        new Money(1000, Currency.USD),
        new Money(1000, Currency.EUR),
      ];
      expect(() => MoneyUtils.sum(mixedAmounts)).toThrow(
        'Currency mismatch: USD vs EUR'
      );
    });
  });

  describe('max', () => {
    it('should find maximum amount', () => {
      const result = MoneyUtils.max(amounts);
      expect(result.amount).toBe(3000);
    });

    it('should throw error for empty array', () => {
      expect(() => MoneyUtils.max([])).toThrow('Cannot find max of empty array');
    });
  });

  describe('min', () => {
    it('should find minimum amount', () => {
      const result = MoneyUtils.min(amounts);
      expect(result.amount).toBe(1000);
    });

    it('should throw error for empty array', () => {
      expect(() => MoneyUtils.min([])).toThrow('Cannot find min of empty array');
    });
  });

  describe('average', () => {
    it('should calculate average amount', () => {
      const result = MoneyUtils.average(amounts);
      expect(result.amount).toBe(2000);
    });

    it('should throw error for empty array', () => {
      expect(() => MoneyUtils.average([])).toThrow(
        'Cannot calculate average of empty array'
      );
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      const amount = new Money(1000, Currency.USD);
      const result = MoneyUtils.applyDiscount(amount, 20);
      expect(result.amount).toBe(800); // 20% discount
    });

    it('should throw error for invalid discount', () => {
      const amount = new Money(1000, Currency.USD);
      expect(() => MoneyUtils.applyDiscount(amount, -10)).toThrow(
        'Discount percent must be between 0 and 100'
      );
      expect(() => MoneyUtils.applyDiscount(amount, 150)).toThrow(
        'Discount percent must be between 0 and 100'
      );
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      const amount = new Money(1000, Currency.USD);
      const result = MoneyUtils.calculateTax(amount, 10);
      expect(result.amount).toBe(100); // 10% tax
    });

    it('should throw error for negative tax', () => {
      const amount = new Money(1000, Currency.USD);
      expect(() => MoneyUtils.calculateTax(amount, -5)).toThrow(
        'Tax percent cannot be negative'
      );
    });
  });

  describe('addTax', () => {
    it('should add tax to amount', () => {
      const amount = new Money(1000, Currency.USD);
      const result = MoneyUtils.addTax(amount, 10);
      expect(result.amount).toBe(1100); // Original + 10% tax
    });
  });
});