/**
 * Price formatting utilities for consistent currency display
 */

export interface Money {
  amount: number;
  currency_code: string;
}

export interface FormatPriceOptions {
  locale?: string;
  showCurrency?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format a price with currency symbol
 * @param amount - The amount in cents
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number,
  currencyCode: string = 'USD',
  options: FormatPriceOptions = {}
): string {
  const {
    locale = 'en-US',
    showCurrency = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  // Convert from cents to dollars
  const value = amount / 100;

  const formatter = new Intl.NumberFormat(locale, {
    style: showCurrency ? 'currency' : 'decimal',
    currency: showCurrency ? currencyCode : undefined,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(value);
}

/**
 * Format a Money object
 * @param money - Money object with amount and currency_code
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatMoney(
  money: Money | null | undefined,
  options: FormatPriceOptions = {}
): string {
  if (!money) return formatPrice(0, 'USD', options);
  return formatPrice(money.amount, money.currency_code, options);
}

/**
 * Format a price range
 * @param minPrice - Minimum price in cents
 * @param maxPrice - Maximum price in cents
 * @param currencyCode - ISO currency code
 * @param options - Formatting options
 * @returns Formatted price range string
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currencyCode: string = 'USD',
  options: FormatPriceOptions = {}
): string {
  const min = formatPrice(minPrice, currencyCode, options);
  const max = formatPrice(maxPrice, currencyCode, options);
  
  if (minPrice === maxPrice) {
    return min;
  }
  
  return `${min} - ${max}`;
}

/**
 * Calculate and format a discount percentage
 * @param originalPrice - Original price in cents
 * @param salePrice - Sale price in cents
 * @returns Discount percentage string
 */
export function formatDiscount(
  originalPrice: number,
  salePrice: number
): string {
  if (originalPrice <= salePrice) return '0%';
  
  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return `${Math.round(discount)}%`;
}

/**
 * Get currency symbol for a currency code
 * @param currencyCode - ISO currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(0).replace(/\d/g, '').trim();
}