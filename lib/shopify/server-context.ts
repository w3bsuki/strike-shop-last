/**
 * Server-side utilities for getting Shopify market context
 * Used in server components and API routes
 */

import { cookies, headers } from 'next/headers';
import type { ShopifyRequestContext } from './client';
import { getCurrentMarket } from './markets';
import { localeToShopifyContext } from './locale-utils';
import type { Locale } from '@/lib/i18n/config';

/**
 * Get Shopify context from server request
 * Combines locale and market preferences
 */
export async function getServerShopifyContext(locale?: Locale): Promise<ShopifyRequestContext> {
  // Get current market from cookies
  const market = await getCurrentMarket();
  const marketSettings = market.countries[0];
  
  if (!marketSettings) {
    throw new Error(`Market ${market.handle} has no countries configured`);
  }
  
  // If locale is provided, use it for language context
  if (locale) {
    const localeContext = localeToShopifyContext(locale);
    return {
      language: localeContext.language,
      country: marketSettings.code,
      market: market.handle,
    };
  }
  
  // Otherwise use market's default language
  return {
    language: marketSettings.defaultLanguage.toUpperCase(),
    country: marketSettings.code,
    market: market.handle,
  };
}

/**
 * Get buyer IP from request headers
 * Used for geo-detection in Shopify
 */
export async function getBuyerIp(): Promise<string | undefined> {
  const headersList = await headers();
  
  // Check various IP headers in order of preference
  const ipHeaders = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];
  
  for (const header of ipHeaders) {
    const value = headersList.get(header);
    if (value) {
      // For x-forwarded-for, take the first IP
      const firstIp = value.split(',')[0];
      return firstIp ? firstIp.trim() : undefined;
    }
  }
  
  return undefined;
}

/**
 * Create enhanced Shopify context with buyer IP
 */
export async function getEnhancedShopifyContext(locale?: Locale): Promise<ShopifyRequestContext> {
  const context = await getServerShopifyContext(locale);
  const buyerIp = await getBuyerIp();
  
  if (buyerIp) {
    return { ...context, buyerIp };
  }
  
  return context;
}