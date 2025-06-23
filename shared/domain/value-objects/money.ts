/**
 * Money Value Object
 * Implements Martin Fowler's Money pattern with proper currency handling
 */

import { z } from 'zod';

// Supported currencies with metadata
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', decimals: 2, name: 'US Dollar' },
  EUR: { symbol: '€', decimals: 2, name: 'Euro' },
  GBP: { symbol: '£', decimals: 2, name: 'British Pound' },
  JPY: { symbol: '¥', decimals: 0, name: 'Japanese Yen' },
  CAD: { symbol: 'C$', decimals: 2, name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', decimals: 2, name: 'Australian Dollar' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Validation schemas
const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
const amountSchema = z.number().finite().safe();

/**
 * Currency value object
 */
export class Currency {
  private readonly _code: SupportedCurrency;

  constructor(code: SupportedCurrency) {
    const result = currencySchema.safeParse(code);
    if (!result.success) {
      throw new Error(`Unsupported currency: ${code}`);
    }
    this._code = code;
  }

  get code(): SupportedCurrency {
    return this._code;
  }

  get symbol(): string {
    return SUPPORTED_CURRENCIES[this._code].symbol;
  }

  get decimals(): number {
    return SUPPORTED_CURRENCIES[this._code].decimals;
  }

  get name(): string {
    return SUPPORTED_CURRENCIES[this._code].name;
  }

  equals(other: Currency): boolean {
    return this._code === other._code;
  }

  toString(): string {
    return this._code;
  }

  static USD = new Currency('USD');
  static EUR = new Currency('EUR');
  static GBP = new Currency('GBP');
  static JPY = new Currency('JPY');
  static CAD = new Currency('CAD');
  static AUD = new Currency('AUD');

  static fromString(code: string): Currency {
    const upperCode = code.toUpperCase() as SupportedCurrency;
    return new Currency(upperCode);
  }
}

/**
 * Money value object implementing the Money pattern
 * Stores amounts in smallest currency unit (cents) for precision
 */
export class Money {
  private readonly _amount: number; // Amount in smallest currency unit
  private readonly _currency: Currency;

  /**
   * Create Money from smallest currency unit (e.g., cents)
   */
  constructor(amount: number, currency: Currency) {
    const amountResult = amountSchema.safeParse(amount);
    if (!amountResult.success) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Amount must be an integer representing smallest currency unit');
    }

    this._amount = amount;
    this._currency = currency;
  }

  /**
   * Create Money from decimal amount (e.g., 19.99)
   */
  static fromDecimal(amount: number, currency: Currency): Money {
    const result = amountSchema.safeParse(amount);
    if (!result.success) {
      throw new Error(`Invalid decimal amount: ${amount}`);
    }

    const smallestUnit = Math.round(amount * Math.pow(10, currency.decimals));
    return new Money(smallestUnit, currency);
  }

  /**
   * Create Money from string (e.g., "19.99")
   */
  static fromString(amount: string, currency: Currency): Money {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) {
      throw new Error(`Invalid amount string: ${amount}`);
    }
    return Money.fromDecimal(parsed, currency);
  }

  /**
   * Create zero money in given currency
   */
  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  /**
   * Get amount in smallest currency unit
   */
  get amount(): number {
    return this._amount;
  }

  /**
   * Get amount as decimal
   */
  get decimalAmount(): number {
    return this._amount / Math.pow(10, this._currency.decimals);
  }

  /**
   * Get currency
   */
  get currency(): Currency {
    return this._currency;
  }

  /**
   * Check if this money is zero
   */
  get isZero(): boolean {
    return this._amount === 0;
  }

  /**
   * Check if this money is positive
   */
  get isPositive(): boolean {
    return this._amount > 0;
  }

  /**
   * Check if this money is negative
   */
  get isNegative(): boolean {
    return this._amount < 0;
  }

  /**
   * Add money (must be same currency)
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Subtract money (must be same currency)
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new Error('Factor must be finite');
    }
    return new Money(Math.round(this._amount * factor), this._currency);
  }

  /**
   * Divide by a divisor
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    if (!Number.isFinite(divisor)) {
      throw new Error('Divisor must be finite');
    }
    return new Money(Math.round(this._amount / divisor), this._currency);
  }

  /**
   * Compare money amounts
   */
  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency.equals(other._currency);
  }

  /**
   * Check if this money is greater than other
   */
  greaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  /**
   * Check if this money is greater than or equal to other
   */
  greaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount >= other._amount;
  }

  /**
   * Check if this money is less than other
   */
  lessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  /**
   * Check if this money is less than or equal to other
   */
  lessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount <= other._amount;
  }

  /**
   * Get absolute value
   */
  abs(): Money {
    return new Money(Math.abs(this._amount), this._currency);
  }

  /**
   * Negate the amount
   */
  negate(): Money {
    return new Money(-this._amount, this._currency);
  }

  /**
   * Format as currency string
   */
  format(locale?: string): string {
    const localeToUse = locale || this.getDefaultLocale();
    
    return new Intl.NumberFormat(localeToUse, {
      style: 'currency',
      currency: this._currency.code,
      minimumFractionDigits: this._currency.decimals,
      maximumFractionDigits: this._currency.decimals,
    }).format(this.decimalAmount);
  }

  /**
   * Get formatted amount without currency symbol
   */
  formatAmount(locale?: string): string {
    const localeToUse = locale || this.getDefaultLocale();
    
    return new Intl.NumberFormat(localeToUse, {
      minimumFractionDigits: this._currency.decimals,
      maximumFractionDigits: this._currency.decimals,
    }).format(this.decimalAmount);
  }

  /**
   * String representation
   */
  toString(): string {
    return this.format();
  }

  /**
   * JSON serialization
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this._amount,
      currency: this._currency.code,
    };
  }

  /**
   * Create Money from JSON
   */
  static fromJSON(json: { amount: number; currency: string }): Money {
    return new Money(json.amount, new Currency(json.currency as SupportedCurrency));
  }

  /**
   * Ensure two money objects have the same currency
   */
  private ensureSameCurrency(other: Money): void {
    if (!this._currency.equals(other._currency)) {
      throw new Error(
        `Currency mismatch: ${this._currency.code} vs ${other._currency.code}`
      );
    }
  }

  /**
   * Get default locale for currency
   */
  private getDefaultLocale(): string {
    switch (this._currency.code) {
      case 'USD':
      case 'CAD':
        return 'en-US';
      case 'EUR':
        return 'en-DE';
      case 'GBP':
        return 'en-GB';
      case 'JPY':
        return 'ja-JP';
      case 'AUD':
        return 'en-AU';
      default:
        return 'en-US';
    }
  }
}

/**
 * Money range value object
 */
export class MoneyRange {
  private readonly _min: Money;
  private readonly _max: Money;

  constructor(min: Money, max: Money) {
    if (!min.currency.equals(max.currency)) {
      throw new Error('Min and max must have the same currency');
    }
    if (min.greaterThan(max)) {
      throw new Error('Min cannot be greater than max');
    }
    this._min = min;
    this._max = max;
  }

  get min(): Money {
    return this._min;
  }

  get max(): Money {
    return this._max;
  }

  get currency(): Currency {
    return this._min.currency;
  }

  /**
   * Check if amount is within range
   */
  contains(amount: Money): boolean {
    return amount.greaterThanOrEqual(this._min) && amount.lessThanOrEqual(this._max);
  }

  /**
   * Check if ranges overlap
   */
  overlaps(other: MoneyRange): boolean {
    return this._min.lessThanOrEqual(other._max) && this._max.greaterThanOrEqual(other._min);
  }

  /**
   * Format range as string
   */
  format(locale?: string): string {
    return `${this._min.format(locale)} - ${this._max.format(locale)}`;
  }

  toString(): string {
    return this.format();
  }

  toJSON(): { min: ReturnType<Money['toJSON']>; max: ReturnType<Money['toJSON']> } {
    return {
      min: this._min.toJSON(),
      max: this._max.toJSON(),
    };
  }

  static fromJSON(json: { min: { amount: number; currency: string }; max: { amount: number; currency: string } }): MoneyRange {
    return new MoneyRange(
      Money.fromJSON(json.min),
      Money.fromJSON(json.max)
    );
  }
}

/**
 * Utility functions for money operations
 */
export const MoneyUtils = {
  /**
   * Sum array of money amounts (must all be same currency)
   */
  sum(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new Error('Cannot sum empty array');
    }
    
    return amounts.reduce((sum, amount) => sum.add(amount));
  },

  /**
   * Find maximum money amount
   */
  max(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new Error('Cannot find max of empty array');
    }
    
    return amounts.reduce((max, amount) => 
      amount.greaterThan(max) ? amount : max
    );
  },

  /**
   * Find minimum money amount
   */
  min(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new Error('Cannot find min of empty array');
    }
    
    return amounts.reduce((min, amount) => 
      amount.lessThan(min) ? amount : min
    );
  },

  /**
   * Calculate average of money amounts
   */
  average(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new Error('Cannot calculate average of empty array');
    }
    
    const sum = this.sum(amounts);
    return sum.divide(amounts.length);
  },

  /**
   * Apply discount percentage to money amount
   */
  applyDiscount(amount: Money, discountPercent: number): Money {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount percent must be between 0 and 100');
    }
    
    const discountFactor = (100 - discountPercent) / 100;
    return amount.multiply(discountFactor);
  },

  /**
   * Calculate tax amount
   */
  calculateTax(amount: Money, taxPercent: number): Money {
    if (taxPercent < 0) {
      throw new Error('Tax percent cannot be negative');
    }
    
    return amount.multiply(taxPercent / 100);
  },

  /**
   * Add tax to amount
   */
  addTax(amount: Money, taxPercent: number): Money {
    const tax = this.calculateTax(amount, taxPercent);
    return amount.add(tax);
  }
};