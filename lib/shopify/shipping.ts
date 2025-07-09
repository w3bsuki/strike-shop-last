/**
 * Shopify Shipping configuration and utilities
 * Handles shipping zones, rates, and methods for different markets
 */

import type { MoneyV2 } from './types';
import { CountryCode, CurrencyCode } from './types';
import type { Market } from './markets-client';
import { getMarketByCountry, AVAILABLE_MARKETS } from './markets-client';

// Shipping method types
export enum ShippingMethodType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  PRIORITY = 'PRIORITY',
  ECONOMY = 'ECONOMY',
  SAME_DAY = 'SAME_DAY',
}

// Shipping carrier types
export enum ShippingCarrier {
  ECONT = 'ECONT',
  SPEEDY = 'SPEEDY',
  DHL = 'DHL',
  UPS = 'UPS',
  FEDEX = 'FEDEX',
  NOVA_POSHTA = 'NOVA_POSHTA',
  UKRPOSHTA = 'UKRPOSHTA',
  DPD = 'DPD',
  GLS = 'GLS',
}

// Shipping zone configuration
export interface ShippingZone {
  id: string;
  name: string;
  countries: CountryCode[];
  methods: ShippingMethod[];
  freeShippingThreshold?: {
    amount: number;
    currency: string;
  };
}

// Shipping method configuration
export interface ShippingMethod {
  id: string;
  name: string;
  type: ShippingMethodType;
  carrier: ShippingCarrier;
  description: string;
  estimatedDays: {
    min: number;
    max: number;
  };
  baseRate: {
    amount: number;
    currency: string;
  };
  weightRate?: {
    amount: number; // per kg
    currency: string;
  };
  maxWeight?: number; // in kg
  available: boolean;
  restrictions?: string[];
}

// Shipping calculation result
export interface ShippingRate {
  method: ShippingMethod;
  price: MoneyV2;
  estimatedDelivery: {
    min: Date;
    max: Date;
  };
  available: boolean;
  message?: string;
}

// Shipping address validation result
export interface AddressValidationResult {
  valid: boolean;
  errors: string[];
  suggestions?: Array<{
    field: string;
    value: string;
  }>;
}

// Define shipping zones for the 3 markets
export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'zone-bg',
    name: 'Bulgaria',
    countries: [CountryCode.BG],
    methods: [
      {
        id: 'bg-standard',
        name: 'Standard Shipping (Econt)',
        type: ShippingMethodType.STANDARD,
        carrier: ShippingCarrier.ECONT,
        description: 'Delivery to Econt office or address',
        estimatedDays: { min: 1, max: 3 },
        baseRate: { amount: 5.90, currency: CurrencyCode.BGN as string },
        weightRate: { amount: 0.50, currency: CurrencyCode.BGN as string },
        maxWeight: 30,
        available: true,
      },
      {
        id: 'bg-express',
        name: 'Express Shipping (Speedy)',
        type: ShippingMethodType.EXPRESS,
        carrier: ShippingCarrier.SPEEDY,
        description: 'Next business day delivery',
        estimatedDays: { min: 1, max: 1 },
        baseRate: { amount: 9.90, currency: CurrencyCode.BGN as string },
        weightRate: { amount: 0.80, currency: CurrencyCode.BGN as string },
        maxWeight: 25,
        available: true,
      },
      {
        id: 'bg-economy',
        name: 'Economy Shipping',
        type: ShippingMethodType.ECONOMY,
        carrier: ShippingCarrier.ECONT,
        description: 'Delivery to Econt office only',
        estimatedDays: { min: 2, max: 5 },
        baseRate: { amount: 3.90, currency: CurrencyCode.BGN as string },
        weightRate: { amount: 0.30, currency: CurrencyCode.BGN as string },
        maxWeight: 30,
        available: true,
      },
    ],
    freeShippingThreshold: {
      amount: 100,
      currency: CurrencyCode.BGN as string,
    },
  },
  {
    id: 'zone-eu',
    name: 'European Union',
    countries: [CountryCode.DE, CountryCode.FR, CountryCode.IT, CountryCode.ES, CountryCode.NL, CountryCode.BE, CountryCode.AT, CountryCode.PL, CountryCode.CZ, CountryCode.SK, CountryCode.HU, CountryCode.RO, CountryCode.GR, CountryCode.PT, CountryCode.SE, CountryCode.DK, CountryCode.FI, CountryCode.IE, CountryCode.LU, CountryCode.SI, CountryCode.HR, CountryCode.LT, CountryCode.LV, CountryCode.EE, CountryCode.MT, CountryCode.CY],
    methods: [
      {
        id: 'eu-standard',
        name: 'Standard EU Shipping (DPD)',
        type: ShippingMethodType.STANDARD,
        carrier: ShippingCarrier.DPD,
        description: 'Standard delivery across EU',
        estimatedDays: { min: 3, max: 7 },
        baseRate: { amount: 12.00, currency: CurrencyCode.EUR as string },
        weightRate: { amount: 1.00, currency: CurrencyCode.EUR as string },
        maxWeight: 30,
        available: true,
      },
      {
        id: 'eu-express',
        name: 'Express EU Shipping (DHL)',
        type: ShippingMethodType.EXPRESS,
        carrier: ShippingCarrier.DHL,
        description: 'Express delivery across EU',
        estimatedDays: { min: 1, max: 3 },
        baseRate: { amount: 25.00, currency: CurrencyCode.EUR as string },
        weightRate: { amount: 2.00, currency: CurrencyCode.EUR as string },
        maxWeight: 25,
        available: true,
      },
      {
        id: 'eu-priority',
        name: 'Priority Shipping (UPS)',
        type: ShippingMethodType.PRIORITY,
        carrier: ShippingCarrier.UPS,
        description: 'Priority handling and delivery',
        estimatedDays: { min: 2, max: 4 },
        baseRate: { amount: 18.00, currency: CurrencyCode.EUR as string },
        weightRate: { amount: 1.50, currency: CurrencyCode.EUR as string },
        maxWeight: 30,
        available: true,
      },
    ],
    freeShippingThreshold: {
      amount: 75,
      currency: CurrencyCode.EUR as string,
    },
  },
  {
    id: 'zone-ua',
    name: 'Ukraine',
    countries: [CountryCode.UA],
    methods: [
      {
        id: 'ua-standard',
        name: 'Standard Shipping (Nova Poshta)',
        type: ShippingMethodType.STANDARD,
        carrier: ShippingCarrier.NOVA_POSHTA,
        description: 'Delivery to Nova Poshta office or address',
        estimatedDays: { min: 2, max: 5 },
        baseRate: { amount: 85, currency: CurrencyCode.UAH as string },
        weightRate: { amount: 15, currency: CurrencyCode.UAH as string },
        maxWeight: 30,
        available: true,
      },
      {
        id: 'ua-express',
        name: 'Express Shipping (Nova Poshta)',
        type: ShippingMethodType.EXPRESS,
        carrier: ShippingCarrier.NOVA_POSHTA,
        description: 'Express delivery within Ukraine',
        estimatedDays: { min: 1, max: 2 },
        baseRate: { amount: 150, currency: CurrencyCode.UAH as string },
        weightRate: { amount: 25, currency: CurrencyCode.UAH as string },
        maxWeight: 25,
        available: true,
      },
      {
        id: 'ua-economy',
        name: 'Economy Shipping (Ukrposhta)',
        type: ShippingMethodType.ECONOMY,
        carrier: ShippingCarrier.UKRPOSHTA,
        description: 'Budget delivery option',
        estimatedDays: { min: 5, max: 10 },
        baseRate: { amount: 45, currency: CurrencyCode.UAH as string },
        weightRate: { amount: 8, currency: CurrencyCode.UAH as string },
        maxWeight: 30,
        available: true,
      },
    ],
    freeShippingThreshold: {
      amount: 1500,
      currency: CurrencyCode.UAH as string,
    },
  },
];

/**
 * Get shipping zone by country code
 */
export function getShippingZone(countryCode: CountryCode): ShippingZone | null {
  return SHIPPING_ZONES.find(zone => 
    zone.countries.includes(countryCode)
  ) || null;
}

/**
 * Calculate shipping rates for a given destination and cart
 */
export function calculateShippingRates(
  countryCode: CountryCode,
  weight: number, // in kg
  subtotal: MoneyV2,
  postalCode?: string
): ShippingRate[] {
  const zone = getShippingZone(countryCode);
  if (!zone) return [];

  const rates: ShippingRate[] = [];
  const currentDate = new Date();

  // Check if eligible for free shipping
  const freeShippingEligible = zone.freeShippingThreshold && 
    subtotal.currencyCode === zone.freeShippingThreshold.currency &&
    parseFloat(subtotal.amount) >= zone.freeShippingThreshold.amount;

  zone.methods.forEach(method => {
    // Check weight restrictions
    if (method.maxWeight && weight > method.maxWeight) {
      rates.push({
        method,
        price: { amount: '0', currencyCode: method.baseRate.currency as CurrencyCode },
        estimatedDelivery: {
          min: new Date(),
          max: new Date(),
        },
        available: false,
        message: `Maximum weight exceeded (${method.maxWeight}kg)`,
      });
      return;
    }

    // Calculate price
    let price = method.baseRate.amount;
    if (method.weightRate) {
      price += weight * method.weightRate.amount;
    }

    // Apply free shipping if eligible
    if (freeShippingEligible && method.type === ShippingMethodType.STANDARD) {
      price = 0;
    }

    // Calculate estimated delivery dates
    const minDeliveryDate = new Date(currentDate);
    minDeliveryDate.setDate(minDeliveryDate.getDate() + method.estimatedDays.min);
    
    const maxDeliveryDate = new Date(currentDate);
    maxDeliveryDate.setDate(maxDeliveryDate.getDate() + method.estimatedDays.max);

    // Skip weekends for business day calculation
    const adjustedMinDate = adjustForWeekends(minDeliveryDate);
    const adjustedMaxDate = adjustForWeekends(maxDeliveryDate);

    rates.push({
      method,
      price: {
        amount: price.toFixed(2),
        currencyCode: method.baseRate.currency as CurrencyCode,
      },
      estimatedDelivery: {
        min: adjustedMinDate,
        max: adjustedMaxDate,
      },
      available: method.available,
      message: freeShippingEligible && price === 0 ? 'Free shipping' : undefined,
    });
  });

  // Sort by price (cheapest first)
  return rates.sort((a, b) => 
    parseFloat(a.price.amount) - parseFloat(b.price.amount)
  );
}

/**
 * Validate shipping address for a specific market
 */
export function validateShippingAddress(
  address: {
    address1?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  },
  countryCode: CountryCode
): AddressValidationResult {
  const errors: string[] = [];
  
  // Basic validation
  if (!address.address1 || address.address1.length < 5) {
    errors.push('Street address is required');
  }
  
  if (!address.city || address.city.length < 2) {
    errors.push('City is required');
  }
  
  if (!address.country) {
    errors.push('Country is required');
  }
  
  // Country-specific validation
  switch (countryCode) {
    case 'BG':
      if (!address.zip || !/^\d{4}$/.test(address.zip)) {
        errors.push('Valid 4-digit postal code is required for Bulgaria');
      }
      break;
      
    case 'DE':
      if (!address.zip || !/^\d{5}$/.test(address.zip)) {
        errors.push('Valid 5-digit postal code is required for Germany');
      }
      break;
      
    case 'UA':
      if (!address.zip || !/^\d{5}$/.test(address.zip)) {
        errors.push('Valid 5-digit postal code is required for Ukraine');
      }
      break;
      
    default:
      if (!address.zip) {
        errors.push('Postal code is required');
      }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get free shipping threshold for a country
 */
export function getFreeShippingThreshold(countryCode: CountryCode): MoneyV2 | null {
  const zone = getShippingZone(countryCode);
  if (!zone || !zone.freeShippingThreshold) return null;
  
  return {
    amount: zone.freeShippingThreshold.amount.toString(),
    currencyCode: zone.freeShippingThreshold.currency as CurrencyCode,
  };
}

/**
 * Calculate remaining amount for free shipping
 */
export function calculateFreeShippingProgress(
  subtotal: MoneyV2,
  countryCode: CountryCode
): {
  eligible: boolean;
  remaining: MoneyV2 | null;
  percentage: number;
} {
  const threshold = getFreeShippingThreshold(countryCode);
  if (!threshold) {
    return { eligible: false, remaining: null, percentage: 0 };
  }
  
  const subtotalAmount = parseFloat(subtotal.amount);
  const thresholdAmount = parseFloat(threshold.amount);
  
  if (subtotal.currencyCode !== threshold.currencyCode) {
    // Currency mismatch, can't calculate
    return { eligible: false, remaining: null, percentage: 0 };
  }
  
  const eligible = subtotalAmount >= thresholdAmount;
  const remaining = eligible ? 0 : thresholdAmount - subtotalAmount;
  const percentage = Math.min((subtotalAmount / thresholdAmount) * 100, 100);
  
  return {
    eligible,
    remaining: remaining > 0 ? {
      amount: remaining.toFixed(2),
      currencyCode: threshold.currencyCode,
    } : null,
    percentage,
  };
}

/**
 * Get shipping carrier tracking URL
 */
export function getCarrierTrackingUrl(carrier: ShippingCarrier, trackingNumber: string): string {
  switch (carrier) {
    case ShippingCarrier.ECONT:
      return `https://www.econt.com/services/track-shipment/${trackingNumber}`;
    case ShippingCarrier.SPEEDY:
      return `https://www.speedy.bg/en/track-shipment?shipmentNumber=${trackingNumber}`;
    case ShippingCarrier.DHL:
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    case ShippingCarrier.UPS:
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    case ShippingCarrier.FEDEX:
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    case ShippingCarrier.NOVA_POSHTA:
      return `https://novaposhta.ua/tracking/?cargo_number=${trackingNumber}`;
    case ShippingCarrier.UKRPOSHTA:
      return `https://track.ukrposhta.ua/tracking_EN.html?barcode=${trackingNumber}`;
    case ShippingCarrier.DPD:
      return `https://www.dpd.com/tracking?parcelNumber=${trackingNumber}`;
    case ShippingCarrier.GLS:
      return `https://gls-group.com/track/${trackingNumber}`;
    default:
      return '#';
  }
}

/**
 * Check if shipping method supports a specific product type
 */
export function isShippingMethodAvailable(
  method: ShippingMethod,
  productTypes: string[]
): boolean {
  if (!method.restrictions || method.restrictions.length === 0) {
    return true;
  }
  
  // Check if any product type is restricted
  return !productTypes.some(type => 
    method.restrictions?.includes(type)
  );
}

/**
 * Helper to adjust dates for weekends
 */
function adjustForWeekends(date: Date): Date {
  const day = date.getDay();
  if (day === 0) { // Sunday
    date.setDate(date.getDate() + 1);
  } else if (day === 6) { // Saturday
    date.setDate(date.getDate() + 2);
  }
  return date;
}

/**
 * Format delivery date range
 */
export function formatDeliveryEstimate(
  minDate: Date,
  maxDate: Date,
  locale: string = 'en'
): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  const minFormatted = minDate.toLocaleDateString(locale, options);
  const maxFormatted = maxDate.toLocaleDateString(locale, options);
  
  if (minFormatted === maxFormatted) {
    return minFormatted;
  }
  
  return `${minFormatted} - ${maxFormatted}`;
}