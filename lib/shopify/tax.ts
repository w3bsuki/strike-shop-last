/**
 * Shopify Tax configuration and utilities
 * Handles tax calculations, VAT rates, and tax-inclusive pricing for different markets
 */

import type { MoneyV2 } from './types';
import { CountryCode, CurrencyCode } from './types';
import type { Market } from './markets';
import { getMarketByCountry } from './markets';

// Tax configuration by country
export interface TaxConfiguration {
  countryCode: CountryCode;
  countryName: string;
  vatRate: number; // Percentage (e.g., 20 for 20%)
  vatIncluded: boolean; // Whether prices include VAT
  digitalVatRate?: number; // Different rate for digital goods
  reducedVatRate?: number; // Reduced rate for certain categories
  taxName: string; // e.g., "VAT", "GST", "Sales Tax"
  taxIdFormat?: RegExp; // Validation pattern for tax IDs
  taxIdName?: string; // e.g., "VAT Number", "Tax ID"
}

// EU VAT rates and configurations
export const TAX_CONFIGURATIONS: TaxConfiguration[] = [
  // Bulgaria
  {
    countryCode: CountryCode.BG,
    countryName: 'Bulgaria',
    vatRate: 20,
    vatIncluded: true,
    reducedVatRate: 9,
    taxName: 'ДДС',
    taxIdFormat: /^BG\d{9,10}$/,
    taxIdName: 'ЕИК/VAT Number',
  },
  
  // Germany
  {
    countryCode: CountryCode.DE,
    countryName: 'Germany',
    vatRate: 19,
    vatIncluded: true,
    reducedVatRate: 7,
    taxName: 'MwSt',
    taxIdFormat: /^DE\d{9}$/,
    taxIdName: 'USt-IdNr.',
  },
  
  // France
  {
    countryCode: CountryCode.FR,
    countryName: 'France',
    vatRate: 20,
    vatIncluded: true,
    reducedVatRate: 5.5,
    taxName: 'TVA',
    taxIdFormat: /^FR[A-Z0-9]{2}\d{9}$/,
    taxIdName: 'Numéro TVA',
  },
  
  // Italy
  {
    countryCode: CountryCode.IT,
    countryName: 'Italy',
    vatRate: 22,
    vatIncluded: true,
    reducedVatRate: 10,
    taxName: 'IVA',
    taxIdFormat: /^IT\d{11}$/,
    taxIdName: 'Partita IVA',
  },
  
  // Spain
  {
    countryCode: CountryCode.ES,
    countryName: 'Spain',
    vatRate: 21,
    vatIncluded: true,
    reducedVatRate: 10,
    taxName: 'IVA',
    taxIdFormat: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    taxIdName: 'NIF/CIF',
  },
  
  // Ukraine (not EU but still has VAT)
  {
    countryCode: CountryCode.UA,
    countryName: 'Ukraine',
    vatRate: 20,
    vatIncluded: true,
    reducedVatRate: 7,
    taxName: 'ПДВ',
    taxIdFormat: /^\d{10}$/,
    taxIdName: 'ЄДРПОУ',
  },
  
  // Netherlands
  {
    countryCode: CountryCode.NL,
    countryName: 'Netherlands',
    vatRate: 21,
    vatIncluded: true,
    reducedVatRate: 9,
    taxName: 'BTW',
    taxIdFormat: /^NL\d{9}B\d{2}$/,
    taxIdName: 'BTW-nummer',
  },
  
  // Belgium
  {
    countryCode: CountryCode.BE,
    countryName: 'Belgium',
    vatRate: 21,
    vatIncluded: true,
    reducedVatRate: 6,
    taxName: 'TVA/BTW',
    taxIdFormat: /^BE0\d{9}$/,
    taxIdName: 'BTW-nummer',
  },
  
  // Austria
  {
    countryCode: CountryCode.AT,
    countryName: 'Austria',
    vatRate: 20,
    vatIncluded: true,
    reducedVatRate: 10,
    taxName: 'MwSt',
    taxIdFormat: /^ATU\d{8}$/,
    taxIdName: 'UID-Nummer',
  },
  
  // Poland
  {
    countryCode: CountryCode.PL,
    countryName: 'Poland',
    vatRate: 23,
    vatIncluded: true,
    reducedVatRate: 8,
    taxName: 'VAT',
    taxIdFormat: /^PL\d{10}$/,
    taxIdName: 'NIP',
  },
  
  // Other EU countries with standard rates
  { countryCode: CountryCode.CZ, countryName: 'Czech Republic', vatRate: 21, vatIncluded: true, taxName: 'DPH' },
  { countryCode: CountryCode.SK, countryName: 'Slovakia', vatRate: 20, vatIncluded: true, taxName: 'DPH' },
  { countryCode: CountryCode.HU, countryName: 'Hungary', vatRate: 27, vatIncluded: true, taxName: 'ÁFA' },
  { countryCode: CountryCode.RO, countryName: 'Romania', vatRate: 19, vatIncluded: true, taxName: 'TVA' },
  { countryCode: CountryCode.GR, countryName: 'Greece', vatRate: 24, vatIncluded: true, taxName: 'ΦΠΑ' },
  { countryCode: CountryCode.PT, countryName: 'Portugal', vatRate: 23, vatIncluded: true, taxName: 'IVA' },
  { countryCode: CountryCode.SE, countryName: 'Sweden', vatRate: 25, vatIncluded: true, taxName: 'Moms' },
  { countryCode: CountryCode.DK, countryName: 'Denmark', vatRate: 25, vatIncluded: true, taxName: 'Moms' },
  { countryCode: CountryCode.FI, countryName: 'Finland', vatRate: 24, vatIncluded: true, taxName: 'ALV' },
  { countryCode: CountryCode.IE, countryName: 'Ireland', vatRate: 23, vatIncluded: true, taxName: 'VAT' },
  { countryCode: CountryCode.LU, countryName: 'Luxembourg', vatRate: 17, vatIncluded: true, taxName: 'TVA' },
  { countryCode: CountryCode.SI, countryName: 'Slovenia', vatRate: 22, vatIncluded: true, taxName: 'DDV' },
  { countryCode: CountryCode.HR, countryName: 'Croatia', vatRate: 25, vatIncluded: true, taxName: 'PDV' },
  { countryCode: CountryCode.LT, countryName: 'Lithuania', vatRate: 21, vatIncluded: true, taxName: 'PVM' },
  { countryCode: CountryCode.LV, countryName: 'Latvia', vatRate: 21, vatIncluded: true, taxName: 'PVN' },
  { countryCode: CountryCode.EE, countryName: 'Estonia', vatRate: 22, vatIncluded: true, taxName: 'KM' },
  { countryCode: CountryCode.MT, countryName: 'Malta', vatRate: 18, vatIncluded: true, taxName: 'VAT' },
  { countryCode: CountryCode.CY, countryName: 'Cyprus', vatRate: 19, vatIncluded: true, taxName: 'ΦΠΑ' },
];

// Tax calculation result
export interface TaxCalculationResult {
  subtotal: MoneyV2;
  taxAmount: MoneyV2;
  total: MoneyV2;
  taxRate: number;
  taxName: string;
  pricesIncludeTax: boolean;
}

// Tax line item
export interface TaxLineItem {
  title: string;
  rate: number;
  amount: MoneyV2;
}

/**
 * Get tax configuration for a country
 */
export function getTaxConfiguration(countryCode: CountryCode): TaxConfiguration | null {
  return TAX_CONFIGURATIONS.find(config => config.countryCode === countryCode) || null;
}

/**
 * Calculate tax for a given amount and country
 */
export function calculateTax(
  amount: MoneyV2,
  countryCode: CountryCode,
  isDigitalProduct: boolean = false,
  isReducedRate: boolean = false
): TaxCalculationResult {
  const config = getTaxConfiguration(countryCode);
  
  if (!config) {
    // No tax configuration found, return zero tax
    return {
      subtotal: amount,
      taxAmount: { amount: '0', currencyCode: amount.currencyCode },
      total: amount,
      taxRate: 0,
      taxName: 'Tax',
      pricesIncludeTax: false,
    };
  }
  
  // Determine which rate to use
  let taxRate = config.vatRate;
  if (isDigitalProduct && config.digitalVatRate) {
    taxRate = config.digitalVatRate;
  } else if (isReducedRate && config.reducedVatRate) {
    taxRate = config.reducedVatRate;
  }
  
  const amountValue = parseFloat(amount.amount);
  let subtotal: number;
  let taxAmount: number;
  let total: number;
  
  if (config.vatIncluded) {
    // Prices include tax - extract tax amount
    total = amountValue;
    subtotal = amountValue / (1 + taxRate / 100);
    taxAmount = total - subtotal;
  } else {
    // Prices exclude tax - add tax amount
    subtotal = amountValue;
    taxAmount = subtotal * (taxRate / 100);
    total = subtotal + taxAmount;
  }
  
  return {
    subtotal: {
      amount: subtotal.toFixed(2),
      currencyCode: amount.currencyCode,
    },
    taxAmount: {
      amount: taxAmount.toFixed(2),
      currencyCode: amount.currencyCode,
    },
    total: {
      amount: total.toFixed(2),
      currencyCode: amount.currencyCode,
    },
    taxRate,
    taxName: config.taxName,
    pricesIncludeTax: config.vatIncluded,
  };
}

/**
 * Calculate tax for multiple line items
 */
export function calculateTaxForLineItems(
  lineItems: Array<{
    price: MoneyV2;
    quantity: number;
    isDigital?: boolean;
    isReducedRate?: boolean;
  }>,
  countryCode: CountryCode
): {
  subtotal: MoneyV2;
  taxLines: TaxLineItem[];
  totalTax: MoneyV2;
  total: MoneyV2;
} {
  const config = getTaxConfiguration(countryCode);
  const currency = lineItems[0]?.price.currencyCode || 'EUR';
  
  let totalSubtotal = 0;
  let totalTaxAmount = 0;
  const taxLines: TaxLineItem[] = [];
  const taxByRate = new Map<number, { amount: number; items: number }>();
  
  lineItems.forEach(item => {
    const itemTotal = parseFloat(item.price.amount) * item.quantity;
    const taxCalc = calculateTax(
      { amount: itemTotal.toString(), currencyCode: currency as CurrencyCode },
      countryCode,
      item.isDigital,
      item.isReducedRate
    );
    
    totalSubtotal += parseFloat(taxCalc.subtotal.amount);
    totalTaxAmount += parseFloat(taxCalc.taxAmount.amount);
    
    // Group tax by rate
    const existing = taxByRate.get(taxCalc.taxRate) || { amount: 0, items: 0 };
    existing.amount += parseFloat(taxCalc.taxAmount.amount);
    existing.items += 1;
    taxByRate.set(taxCalc.taxRate, existing);
  });
  
  // Create tax line items
  taxByRate.forEach((data, rate) => {
    taxLines.push({
      title: `${config?.taxName || 'Tax'} (${rate}%)`,
      rate,
      amount: {
        amount: data.amount.toFixed(2),
        currencyCode: currency as CurrencyCode,
      },
    });
  });
  
  return {
    subtotal: {
      amount: totalSubtotal.toFixed(2),
      currencyCode: currency as CurrencyCode,
    },
    taxLines,
    totalTax: {
      amount: totalTaxAmount.toFixed(2),
      currencyCode: currency as CurrencyCode,
    },
    total: {
      amount: (totalSubtotal + totalTaxAmount).toFixed(2),
      currencyCode: currency as CurrencyCode,
    },
  };
}

/**
 * Format price with tax information
 */
export function formatPriceWithTax(
  price: MoneyV2,
  countryCode: CountryCode,
  showTaxInfo: boolean = true
): string {
  const config = getTaxConfiguration(countryCode);
  const formatter = new Intl.NumberFormat(getLocaleForCountry(countryCode), {
    style: 'currency',
    currency: price.currencyCode,
  });
  
  const formattedPrice = formatter.format(parseFloat(price.amount));
  
  if (!showTaxInfo || !config) {
    return formattedPrice;
  }
  
  if (config.vatIncluded) {
    return `${formattedPrice} (incl. ${config.taxName})`;
  } else {
    return `${formattedPrice} (excl. ${config.taxName})`;
  }
}

/**
 * Validate tax ID format
 */
export function validateTaxId(taxId: string, countryCode: CountryCode): {
  valid: boolean;
  formatted: string;
  error?: string;
} {
  const config = getTaxConfiguration(countryCode);
  
  if (!config || !config.taxIdFormat) {
    return { valid: true, formatted: taxId };
  }
  
  // Remove spaces and convert to uppercase
  const formatted = taxId.replace(/\s/g, '').toUpperCase();
  
  if (!config.taxIdFormat.test(formatted)) {
    return {
      valid: false,
      formatted,
      error: `Invalid ${config.taxIdName || 'tax ID'} format for ${config.countryName}`,
    };
  }
  
  return { valid: true, formatted };
}

/**
 * Check if B2B tax exemption is available
 */
export function isB2BTaxExemptionAvailable(
  buyerCountry: CountryCode,
  sellerCountry: CountryCode,
  hasValidTaxId: boolean
): boolean {
  // EU B2B reverse charge mechanism
  const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
  
  const buyerInEU = euCountries.includes(buyerCountry);
  const sellerInEU = euCountries.includes(sellerCountry);
  
  // B2B tax exemption applies when:
  // 1. Both are in EU but different countries
  // 2. Buyer has valid VAT ID
  return buyerInEU && sellerInEU && buyerCountry !== sellerCountry && hasValidTaxId;
}

/**
 * Get display settings for tax-inclusive pricing
 */
export function getTaxDisplaySettings(countryCode: CountryCode): {
  showTaxIncluded: boolean;
  showTaxBreakdown: boolean;
  taxLabel: string;
} {
  const config = getTaxConfiguration(countryCode);
  
  return {
    showTaxIncluded: config?.vatIncluded || false,
    showTaxBreakdown: config?.vatRate ? config.vatRate > 15 : false, // Show breakdown for high tax rates
    taxLabel: config?.taxName || 'Tax',
  };
}

/**
 * Helper to get locale for country
 */
function getLocaleForCountry(countryCode: CountryCode): string {
  const localeMap: Record<string, string> = {
    BG: 'bg-BG',
    DE: 'de-DE',
    FR: 'fr-FR',
    IT: 'it-IT',
    ES: 'es-ES',
    UA: 'uk-UA',
    NL: 'nl-NL',
    BE: 'nl-BE',
    AT: 'de-AT',
    PL: 'pl-PL',
    CZ: 'cs-CZ',
    SK: 'sk-SK',
    HU: 'hu-HU',
    RO: 'ro-RO',
    GR: 'el-GR',
    PT: 'pt-PT',
    SE: 'sv-SE',
    DK: 'da-DK',
    FI: 'fi-FI',
    IE: 'en-IE',
    LU: 'fr-LU',
    SI: 'sl-SI',
    HR: 'hr-HR',
    LT: 'lt-LT',
    LV: 'lv-LV',
    EE: 'et-EE',
    MT: 'mt-MT',
    CY: 'el-CY',
  };
  
  return localeMap[countryCode] || 'en-US';
}

/**
 * Calculate tax-exclusive price from tax-inclusive price
 */
export function extractTaxFromPrice(
  priceIncludingTax: MoneyV2,
  countryCode: CountryCode
): {
  priceExcludingTax: MoneyV2;
  taxAmount: MoneyV2;
  taxRate: number;
} {
  const config = getTaxConfiguration(countryCode);
  
  if (!config || !config.vatIncluded) {
    return {
      priceExcludingTax: priceIncludingTax,
      taxAmount: { amount: '0', currencyCode: priceIncludingTax.currencyCode },
      taxRate: 0,
    };
  }
  
  const totalAmount = parseFloat(priceIncludingTax.amount);
  const taxRate = config.vatRate;
  const priceExclTax = totalAmount / (1 + taxRate / 100);
  const taxAmount = totalAmount - priceExclTax;
  
  return {
    priceExcludingTax: {
      amount: priceExclTax.toFixed(2),
      currencyCode: priceIncludingTax.currencyCode,
    },
    taxAmount: {
      amount: taxAmount.toFixed(2),
      currencyCode: priceIncludingTax.currencyCode,
    },
    taxRate,
  };
}