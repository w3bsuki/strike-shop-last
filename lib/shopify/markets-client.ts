/**
 * Client-side Shopify Markets utilities
 * For use in client components and pages
 */

import type { Locale } from '@/lib/i18n/config';

// Market configuration for basic Shopify plan
export interface Market {
  id: string;
  handle: string;
  name: string;
  primaryDomain: {
    url: string;
    locale: string;
  };
  countries: {
    code: string;
    name: string;
    currency: {
      code: string;
      symbol: string;
    };
    languages: string[];
    defaultLanguage: string;
  }[];
  enabled: boolean;
}

// Define available markets (Basic plan: 3 markets)
export const AVAILABLE_MARKETS: Market[] = [
  {
    id: 'gid://shopify/Market/1',
    handle: 'bg',
    name: 'Bulgaria',
    primaryDomain: {
      url: 'https://strike-shop.com/bg',
      locale: 'bg-BG',
    },
    countries: [{
      code: 'BG',
      name: 'Bulgaria',
      currency: {
        code: 'BGN',
        symbol: 'лв.',
      },
      languages: ['bg', 'en'],
      defaultLanguage: 'bg',
    }],
    enabled: true,
  },
  {
    id: 'gid://shopify/Market/2',
    handle: 'eu',
    name: 'European Union',
    primaryDomain: {
      url: 'https://strike-shop.com/en',
      locale: 'en-EU',
    },
    countries: [
      {
        code: 'DE',
        name: 'Germany',
        currency: { code: 'EUR', symbol: '€' },
        languages: ['de', 'en'],
        defaultLanguage: 'de',
      },
      {
        code: 'FR',
        name: 'France',
        currency: { code: 'EUR', symbol: '€' },
        languages: ['fr', 'en'],
        defaultLanguage: 'fr',
      },
      {
        code: 'IT',
        name: 'Italy',
        currency: { code: 'EUR', symbol: '€' },
        languages: ['it', 'en'],
        defaultLanguage: 'it',
      },
      {
        code: 'ES',
        name: 'Spain',
        currency: { code: 'EUR', symbol: '€' },
        languages: ['es', 'en'],
        defaultLanguage: 'es',
      },
      // Add more EU countries as needed
    ],
    enabled: true,
  },
  {
    id: 'gid://shopify/Market/3',
    handle: 'ua',
    name: 'Ukraine',
    primaryDomain: {
      url: 'https://strike-shop.com/ua',
      locale: 'uk-UA',
    },
    countries: [{
      code: 'UA',
      name: 'Ukraine',
      currency: {
        code: 'UAH',
        symbol: '₴',
      },
      languages: ['ua', 'en'],
      defaultLanguage: 'ua',
    }],
    enabled: true,
  },
];

// Country to market mapping
export const COUNTRY_TO_MARKET: Record<string, string> = {
  'BG': 'bg',
  'DE': 'eu',
  'FR': 'eu',
  'IT': 'eu',
  'ES': 'eu',
  'NL': 'eu',
  'BE': 'eu',
  'AT': 'eu',
  'PL': 'eu',
  'CZ': 'eu',
  'SK': 'eu',
  'HU': 'eu',
  'RO': 'eu',
  'GR': 'eu',
  'PT': 'eu',
  'SE': 'eu',
  'DK': 'eu',
  'FI': 'eu',
  'IE': 'eu',
  'LU': 'eu',
  'MT': 'eu',
  'CY': 'eu',
  'SI': 'eu',
  'EE': 'eu',
  'LV': 'eu',
  'LT': 'eu',
  'HR': 'eu',
  'UA': 'ua',
};

// Default market for unmatched countries
export const DEFAULT_MARKET = 'eu';

/**
 * Get market by handle
 */
export function getMarketByHandle(handle: string): Market | undefined {
  return AVAILABLE_MARKETS.find(market => market.handle === handle);
}

/**
 * Get market by country code
 */
export function getMarketByCountry(countryCode: string): Market {
  const marketHandle = COUNTRY_TO_MARKET[countryCode.toUpperCase()] || DEFAULT_MARKET;
  const market = getMarketByHandle(marketHandle);
  if (market) {
    return market;
  }
  // Fallback to EU market
  const euMarket = AVAILABLE_MARKETS.find(m => m.handle === 'eu');
  if (euMarket) {
    return euMarket;
  }
  // Last resort fallback - guaranteed to exist
  const fallbackMarket = AVAILABLE_MARKETS[0];
  if (!fallbackMarket) {
    throw new Error('No markets available');
  }
  return fallbackMarket;
}

/**
 * Get currency for a market
 */
export function getMarketCurrency(marketHandle: string): string {
  const market = getMarketByHandle(marketHandle);
  if (!market) return 'EUR';
  
  // Return the first country's currency (all countries in a market should have the same currency)
  return market.countries[0]?.currency.code || 'EUR';
}

/**
 * Get locale for a market and language
 */
export function getMarketLocale(marketHandle: string, language: Locale): string {
  const market = getMarketByHandle(marketHandle);
  if (!market) return 'en-EU';
  
  // Map language to locale format
  const localeMap: Record<string, string> = {
    'en': 'en',
    'bg': 'bg',
    'ua': 'uk',
  };
  
  const mappedLang = localeMap[language] || 'en';
  const country = market.countries[0]?.code || 'EU';
  
  return `${mappedLang}-${country}`;
}

/**
 * Convert Shopify market to our internal market format
 */
export function convertShopifyMarket(shopifyMarket: any): Market {
  // Map Shopify market data to our format
  return {
    id: shopifyMarket.id,
    handle: shopifyMarket.handle || shopifyMarket.id.split('/').pop() || 'unknown',
    name: shopifyMarket.name || 'Unknown Market',
    primaryDomain: {
      url: shopifyMarket.webPresence?.alternateLocales?.[0]?.domain?.url || '',
      locale: shopifyMarket.webPresence?.alternateLocales?.[0]?.locale || 'en',
    },
    countries: shopifyMarket.regions?.nodes?.map((region: any) => ({
      code: region.countryCode || '',
      name: region.name || '',
      currency: {
        code: region.currency?.isoCode || 'EUR',
        symbol: getCurrencySymbol(region.currency?.isoCode || 'EUR'),
      },
      languages: shopifyMarket.webPresence?.alternateLocales?.map((l: any) => l.locale.split('-')[0]) || ['en'],
      defaultLanguage: shopifyMarket.webPresence?.defaultLocale?.split('-')[0] || 'en',
    })) || [],
    enabled: shopifyMarket.enabled ?? true,
  };
}

/**
 * Get currency symbol from ISO code
 */
export function getCurrencySymbol(isoCode: string): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'BGN': 'лв.',
    'UAH': '₴',
    'GBP': '£',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RON': 'lei',
    'SEK': 'kr',
    'DKK': 'kr',
    'NOK': 'kr',
    'CHF': 'Fr',
  };
  
  return symbols[isoCode] || isoCode;
}

/**
 * Validate if a market-currency combination is valid
 */
export function isValidMarketCurrency(marketHandle: string, currencyCode: string): boolean {
  const market = getMarketByHandle(marketHandle);
  if (!market) return false;
  
  return market.countries.some(country => country.currency.code === currencyCode);
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): Array<{ code: string; symbol: string }> {
  const currencies = new Map<string, string>();
  
  AVAILABLE_MARKETS.forEach(market => {
    market.countries.forEach(country => {
      currencies.set(country.currency.code, country.currency.symbol);
    });
  });
  
  return Array.from(currencies.entries()).map(([code, symbol]) => ({ code, symbol }));
}

/**
 * Get all available countries with their markets
 */
export function getAvailableCountries(): Array<{ code: string; name: string; currency: string; market: string }> {
  const countries: Array<{ code: string; name: string; currency: string; market: string }> = [];
  
  AVAILABLE_MARKETS.forEach(market => {
    market.countries.forEach(country => {
      countries.push({
        code: country.code,
        name: country.name,
        currency: country.currency.code,
        market: market.handle,
      });
    });
  });
  
  return countries;
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currencyCode: string, locale?: string): string {
  const formatter = new Intl.NumberFormat(locale || 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

/**
 * Get market from localStorage (client-side only)
 */
export function getStoredMarket(): { market: string; currency: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('market-preference');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading market preference:', error);
  }
  
  return null;
}

/**
 * Store market preference (client-side only)
 */
export function storeMarketPreference(market: string, currency: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('market-preference', JSON.stringify({ market, currency }));
  } catch (error) {
    console.error('Error storing market preference:', error);
  }
}