/**
 * Server-side Shopify Markets utilities
 * For use in server components and API routes only
 */

import { cookies } from 'next/headers';
import type { Locale } from '@/lib/i18n/config';
import {
  AVAILABLE_MARKETS,
  COUNTRY_TO_MARKET,
  DEFAULT_MARKET,
  type Market,
  getMarketByHandle,
  getMarketByCountry,
  getMarketCurrency,
  getMarketLocale,
  convertShopifyMarket,
  getCurrencySymbol,
  isValidMarketCurrency,
  getAvailableCurrencies,
  formatPrice,
} from './markets-client';

// Re-export client utilities
export {
  AVAILABLE_MARKETS,
  COUNTRY_TO_MARKET,
  DEFAULT_MARKET,
  type Market,
  getMarketByHandle,
  getMarketByCountry,
  getMarketCurrency,
  getMarketLocale,
  convertShopifyMarket,
  getCurrencySymbol,
  isValidMarketCurrency,
  getAvailableCurrencies,
  formatPrice,
};

// Server-only utilities below this line

// Cookie names for market preferences
export const MARKET_COOKIE_NAME = 'shopify_market';
export const COUNTRY_COOKIE_NAME = 'shopify_country';
export const CURRENCY_COOKIE_NAME = 'shopify_currency';

/**
 * Get market from locale
 */
export function getMarketFromLocale(locale: Locale): Market {
  let market: Market | undefined;
  
  switch (locale) {
    case 'bg':
      market = getMarketByHandle('bg') || getMarketByHandle('eu');
      break;
    case 'ua':
      market = getMarketByHandle('ua') || getMarketByHandle('eu');
      break;
    case 'en':
    default:
      market = getMarketByHandle('eu');
      break;
  }
  
  // Final fallback
  if (!market) {
    market = AVAILABLE_MARKETS[0];
    if (!market) {
      throw new Error('No markets available');
    }
  }
  
  return market;
}

/**
 * Get current market from cookies or detect from request
 */
export async function getCurrentMarket(): Promise<Market> {
  const cookieStore = await cookies();
  
  // Check for saved market preference
  const savedMarket = cookieStore.get(MARKET_COOKIE_NAME)?.value;
  if (savedMarket) {
    const market = getMarketByHandle(savedMarket);
    if (market) return market;
  }
  
  // Check for saved country preference
  const savedCountry = cookieStore.get(COUNTRY_COOKIE_NAME)?.value;
  if (savedCountry) {
    return getMarketByCountry(savedCountry);
  }
  
  // Return default market (EU)
  const defaultMarket = AVAILABLE_MARKETS[1] || AVAILABLE_MARKETS[0];
  if (!defaultMarket) {
    throw new Error('No markets available');
  }
  return defaultMarket;
}

/**
 * Save market preference to cookies
 */
export async function saveMarketPreference(marketHandle: string, countryCode: string, currencyCode: string) {
  const cookieStore = await cookies();
  
  // Set cookies with 1 year expiry
  const cookieOptions = {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  
  cookieStore.set(MARKET_COOKIE_NAME, marketHandle, cookieOptions);
  cookieStore.set(COUNTRY_COOKIE_NAME, countryCode, cookieOptions);
  cookieStore.set(CURRENCY_COOKIE_NAME, currencyCode, cookieOptions);
}

/**
 * Get market-specific settings
 */
export function getMarketSettings(market: Market) {
  const primaryCountry = market.countries[0];
  
  if (!primaryCountry) {
    throw new Error(`Market ${market.handle} has no countries configured`);
  }
  
  return {
    marketId: market.id,
    marketHandle: market.handle,
    countryCode: primaryCountry.code,
    currencyCode: primaryCountry.currency.code,
    currencySymbol: primaryCountry.currency.symbol,
    languageCode: primaryCountry.defaultLanguage,
    domain: market.primaryDomain.url,
    locale: market.primaryDomain.locale,
  };
}

/**
 * Get currency from cookies
 */
export async function getCurrentCurrency(): Promise<string> {
  const cookieStore = await cookies();
  const savedCurrency = cookieStore.get(CURRENCY_COOKIE_NAME)?.value;
  
  if (savedCurrency) {
    return savedCurrency;
  }
  
  // Get from current market
  const market = await getCurrentMarket();
  return market.countries[0]?.currency.code || 'EUR';
}

/**
 * Clear market preferences
 */
export async function clearMarketPreferences() {
  const cookieStore = await cookies();
  
  cookieStore.delete(MARKET_COOKIE_NAME);
  cookieStore.delete(COUNTRY_COOKIE_NAME);
  cookieStore.delete(CURRENCY_COOKIE_NAME);
}