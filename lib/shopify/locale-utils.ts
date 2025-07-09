/**
 * Locale utilities for Shopify integration
 * Client-safe utilities that don't use Next.js server APIs
 */

import type { Locale } from '@/lib/i18n/config';
import type { ShopifyRequestContext } from './client';

/**
 * Convert app locale to Shopify context
 */
export function localeToShopifyContext(locale: Locale): ShopifyRequestContext {
  switch (locale) {
    case 'bg':
      return {
        language: 'BG',
        country: 'BG',
        market: 'bg',
      };
    case 'ua':
      return {
        language: 'UK', // Ukrainian language code
        country: 'UA',
        market: 'ua',
      };
    case 'en':
    default:
      return {
        language: 'EN',
        country: 'DE', // Default to Germany for EU market
        market: 'eu',
      };
  }
}