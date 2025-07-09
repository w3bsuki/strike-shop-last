/**
 * Shipping carrier configurations and integrations
 * Handles carrier-specific settings and API configurations
 */

import { ShippingCarrier } from './shipping';

// Carrier API configurations
export interface CarrierConfig {
  id: ShippingCarrier;
  name: string;
  apiUrl?: string;
  apiKey?: string;
  supportedCountries: string[];
  trackingUrlTemplate: string;
  features: {
    liveRates: boolean;
    tracking: boolean;
    pickupPoints: boolean;
    labelPrinting: boolean;
    returns: boolean;
  };
}

// Carrier configurations
export const CARRIER_CONFIGS: Record<ShippingCarrier, CarrierConfig> = {
  [ShippingCarrier.ECONT]: {
    id: ShippingCarrier.ECONT,
    name: 'Econt Express',
    apiUrl: process.env.ECONT_API_URL,
    apiKey: process.env.ECONT_API_KEY,
    supportedCountries: ['BG'],
    trackingUrlTemplate: 'https://www.econt.com/services/track-shipment/{trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: true,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.SPEEDY]: {
    id: ShippingCarrier.SPEEDY,
    name: 'Speedy',
    apiUrl: process.env.SPEEDY_API_URL,
    apiKey: process.env.SPEEDY_API_KEY,
    supportedCountries: ['BG', 'RO', 'GR'],
    trackingUrlTemplate: 'https://www.speedy.bg/en/track-shipment?shipmentNumber={trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: true,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.DHL]: {
    id: ShippingCarrier.DHL,
    name: 'DHL Express',
    apiUrl: process.env.DHL_API_URL,
    apiKey: process.env.DHL_API_KEY,
    supportedCountries: ['*'], // Worldwide
    trackingUrlTemplate: 'https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: false,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.UPS]: {
    id: ShippingCarrier.UPS,
    name: 'UPS',
    apiUrl: process.env.UPS_API_URL,
    apiKey: process.env.UPS_API_KEY,
    supportedCountries: ['*'], // Worldwide
    trackingUrlTemplate: 'https://www.ups.com/track?tracknum={trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: true,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.FEDEX]: {
    id: ShippingCarrier.FEDEX,
    name: 'FedEx',
    apiUrl: process.env.FEDEX_API_URL,
    apiKey: process.env.FEDEX_API_KEY,
    supportedCountries: ['*'], // Worldwide
    trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: false,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.NOVA_POSHTA]: {
    id: ShippingCarrier.NOVA_POSHTA,
    name: 'Nova Poshta',
    apiUrl: process.env.NOVA_POSHTA_API_URL,
    apiKey: process.env.NOVA_POSHTA_API_KEY,
    supportedCountries: ['UA'],
    trackingUrlTemplate: 'https://novaposhta.ua/tracking/?cargo_number={trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: true,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.UKRPOSHTA]: {
    id: ShippingCarrier.UKRPOSHTA,
    name: 'Ukrposhta',
    apiUrl: process.env.UKRPOSHTA_API_URL,
    apiKey: process.env.UKRPOSHTA_API_KEY,
    supportedCountries: ['UA'],
    trackingUrlTemplate: 'https://track.ukrposhta.ua/tracking_EN.html?barcode={trackingNumber}',
    features: {
      liveRates: false,
      tracking: true,
      pickupPoints: false,
      labelPrinting: false,
      returns: false,
    },
  },
  [ShippingCarrier.DPD]: {
    id: ShippingCarrier.DPD,
    name: 'DPD',
    apiUrl: process.env.DPD_API_URL,
    apiKey: process.env.DPD_API_KEY,
    supportedCountries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'CZ', 'SK', 'HU', 'RO', 'GR', 'PT', 'SE', 'DK', 'FI', 'IE', 'LU', 'SI', 'HR', 'LT', 'LV', 'EE'],
    trackingUrlTemplate: 'https://www.dpd.com/tracking?parcelNumber={trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: true,
      labelPrinting: true,
      returns: true,
    },
  },
  [ShippingCarrier.GLS]: {
    id: ShippingCarrier.GLS,
    name: 'GLS',
    apiUrl: process.env.GLS_API_URL,
    apiKey: process.env.GLS_API_KEY,
    supportedCountries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'CZ', 'SK', 'HU', 'RO', 'PT', 'DK', 'SI', 'HR'],
    trackingUrlTemplate: 'https://gls-group.com/track/{trackingNumber}',
    features: {
      liveRates: true,
      tracking: true,
      pickupPoints: true,
      labelPrinting: true,
      returns: true,
    },
  },
};

// Special shipping rules
export const SHIPPING_RULES = {
  // Hazmat restrictions by carrier
  hazmatRestrictions: {
    [ShippingCarrier.ECONT]: ['batteries', 'aerosols', 'flammables'],
    [ShippingCarrier.SPEEDY]: ['batteries', 'aerosols'],
    [ShippingCarrier.UKRPOSHTA]: ['batteries', 'aerosols', 'flammables', 'liquids'],
  },
  
  // Weight limits for express shipping (kg)
  expressWeightLimits: {
    [ShippingCarrier.ECONT]: 25,
    [ShippingCarrier.SPEEDY]: 25,
    [ShippingCarrier.DHL]: 30,
    [ShippingCarrier.UPS]: 30,
    [ShippingCarrier.FEDEX]: 30,
    [ShippingCarrier.NOVA_POSHTA]: 30,
    [ShippingCarrier.DPD]: 25,
    [ShippingCarrier.GLS]: 25,
  },
  
  // Dimensional weight divisors
  dimWeightDivisors: {
    [ShippingCarrier.DHL]: 5000,
    [ShippingCarrier.UPS]: 5000,
    [ShippingCarrier.FEDEX]: 5000,
    default: 6000,
  },
};

// Shipping box sizes (for rate calculation)
export const SHIPPING_BOXES = [
  { name: 'Small', length: 20, width: 15, height: 10, maxWeight: 2 },
  { name: 'Medium', length: 30, width: 25, height: 15, maxWeight: 5 },
  { name: 'Large', length: 40, width: 35, height: 25, maxWeight: 10 },
  { name: 'Extra Large', length: 60, width: 40, height: 40, maxWeight: 20 },
];

/**
 * Get carrier configuration
 */
export function getCarrierConfig(carrier: ShippingCarrier): CarrierConfig {
  return CARRIER_CONFIGS[carrier];
}

/**
 * Check if carrier supports a country
 */
export function carrierSupportsCountry(carrier: ShippingCarrier, countryCode: string): boolean {
  const config = CARRIER_CONFIGS[carrier];
  return config.supportedCountries.includes('*') || config.supportedCountries.includes(countryCode);
}

/**
 * Calculate dimensional weight
 */
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  carrier: ShippingCarrier
): number {
  const divisor = (SHIPPING_RULES.dimWeightDivisors as any)[carrier] || SHIPPING_RULES.dimWeightDivisors.default;
  return (length * width * height) / divisor;
}

/**
 * Get suitable box for items
 */
export function getSuitableBox(weight: number, volume: number) {
  return SHIPPING_BOXES.find(box => 
    box.maxWeight >= weight && 
    (box.length * box.width * box.height) >= volume
  ) || SHIPPING_BOXES[SHIPPING_BOXES.length - 1];
}