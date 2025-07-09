// Advanced region detection service for multi-market e-commerce
// Supports Bulgarian, European, and Ukrainian markets

import { type Locale, localeMetadata } from '@/lib/i18n/config';

export interface RegionDetectionResult {
  locale: Locale;
  currency: string;
  confidence: number; // 0-1 scale
  source: 'saved' | 'header' | 'geo' | 'language' | 'default';
  market: 'bg' | 'eu' | 'ua';
}

export interface RegionalMarketConfig {
  locale: Locale;
  currency: string;
  market: 'bg' | 'eu' | 'ua';
  taxInclusive: boolean;
  shippingZones: string[];
  paymentMethods: string[];
  shopifyMarket?: string; // For Shopify Markets API
}

// Regional market configurations
export const REGIONAL_MARKETS: Record<string, RegionalMarketConfig> = {
  bg: {
    locale: 'bg',
    currency: 'BGN',
    market: 'bg',
    taxInclusive: true,
    shippingZones: ['BG', 'EU'],
    paymentMethods: ['card', 'bank_transfer'],
    shopifyMarket: 'BG',
  },
  eu: {
    locale: 'en',
    currency: 'EUR',
    market: 'eu',
    taxInclusive: true,
    shippingZones: ['EU', 'UK', 'INTERNATIONAL'],
    paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
    shopifyMarket: 'EU',
  },
  ua: {
    locale: 'ua',
    currency: 'UAH',
    market: 'ua',
    taxInclusive: false,
    shippingZones: ['UA', 'INTERNATIONAL'],
    paymentMethods: ['card'],
    shopifyMarket: 'UA',
  },
} as const;

// Country to market mapping
const COUNTRY_TO_MARKET: Record<string, string> = {
  // Bulgaria
  'BG': 'bg',
  
  // European Union (EUR zone)
  'AT': 'eu', 'BE': 'eu', 'CY': 'eu', 'EE': 'eu', 'FI': 'eu',
  'FR': 'eu', 'DE': 'eu', 'GR': 'eu', 'IE': 'eu', 'IT': 'eu',
  'LV': 'eu', 'LT': 'eu', 'LU': 'eu', 'MT': 'eu', 'NL': 'eu',
  'PT': 'eu', 'SK': 'eu', 'SI': 'eu', 'ES': 'eu',
  
  // Additional European countries
  'GB': 'eu', 'CH': 'eu', 'NO': 'eu', 'IS': 'eu', 'DK': 'eu',
  'SE': 'eu', 'PL': 'eu', 'CZ': 'eu', 'HU': 'eu', 'RO': 'eu',
  'HR': 'eu',
  
  // Ukraine
  'UA': 'ua',
};

// Cache for region detection results
const detectionCache = new Map<string, { result: RegionDetectionResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class RegionDetectionService {
  static async detectRegion(request?: Request): Promise<RegionDetectionResult> {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache first
    const cached = detectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }

    const result = await this.performDetection(request);
    
    // Cache the result
    detectionCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  private static async performDetection(request?: Request): Promise<RegionDetectionResult> {
    // 1. Check saved preferences (highest confidence)
    const savedPreference = this.checkSavedPreferences();
    if (savedPreference && savedPreference.locale && savedPreference.currency && savedPreference.market) {
      return {
        locale: savedPreference.locale,
        currency: savedPreference.currency,
        market: savedPreference.market,
        confidence: 1.0,
        source: 'saved',
      };
    }

    // 2. Check CDN headers (high confidence)
    if (request) {
      const headerResult = this.detectFromHeaders(request);
      if (headerResult && headerResult.confidence > 0.8) {
        return headerResult;
      }
    }

    // 3. Geo-IP detection (medium confidence)
    const geoResult = await this.detectFromGeoIP();
    if (geoResult && geoResult.confidence > 0.6) {
      return geoResult;
    }

    // 4. Browser language detection (low confidence)
    const languageResult = this.detectFromLanguage();
    if (languageResult && languageResult.confidence > 0.4) {
      return languageResult;
    }

    // 5. Default fallback (European market)
    return this.getDefaultRegion();
  }

  private static checkSavedPreferences(): Partial<RegionDetectionResult> | null {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem('strike-shop-region');
      if (saved) {
        const parsed = JSON.parse(saved);
        const market = REGIONAL_MARKETS[parsed.market];
        if (market) {
          return {
            locale: market.locale,
            currency: market.currency,
            market: market.market,
          };
        }
      }
    } catch (error) {
      console.warn('[RegionDetection] Failed to parse saved preferences:', error);
    }

    return null;
  }

  private static detectFromHeaders(request: Request): RegionDetectionResult | null {
    const headers = request.headers;
    
    // Check Cloudflare country header
    let countryCode = headers.get('cf-ipcountry');
    
    // Fallback to other CDN headers
    if (!countryCode) {
      countryCode = headers.get('x-vercel-ip-country') ||
                   headers.get('x-country-code') ||
                   headers.get('cloudfront-viewer-country');
    }

    if (countryCode && COUNTRY_TO_MARKET[countryCode.toUpperCase()]) {
      const marketKey = COUNTRY_TO_MARKET[countryCode.toUpperCase()];
      if (marketKey) {
        const market = REGIONAL_MARKETS[marketKey];
        if (market) {
          return {
            locale: market.locale,
            currency: market.currency,
            market: market.market,
            confidence: 0.9,
            source: 'header',
          };
        }
      }
    }

    return null;
  }

  private static async detectFromGeoIP(): Promise<RegionDetectionResult | null> {
    if (typeof window === 'undefined') return null;

    try {
      // Try multiple geo-IP services for redundancy
      const services = [
        'https://ipapi.co/country_code',
        'https://api.country.is',
        'https://ipwhois.app/json/?fields=country_code',
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, { signal: AbortSignal.timeout(2000) });
          
          if (!response.ok) continue;
          
          let countryCode: string | null = null;
          
          if (service.includes('ipapi.co')) {
            countryCode = await response.text();
          } else if (service.includes('country.is')) {
            const data = await response.json();
            countryCode = data.country;
          } else if (service.includes('ipwhois.app')) {
            const data = await response.json();
            countryCode = data.country_code;
          }

          if (countryCode && COUNTRY_TO_MARKET[countryCode.toUpperCase()]) {
            const marketKey = COUNTRY_TO_MARKET[countryCode.toUpperCase()];
            if (marketKey) {
              const market = REGIONAL_MARKETS[marketKey];
              if (market) {
                return {
                  locale: market.locale,
                  currency: market.currency,
                  market: market.market,
                  confidence: 0.7,
                  source: 'geo',
                };
              }
            }
          }
        } catch (error) {
          console.warn(`[RegionDetection] Geo-IP service failed: ${service}`, error);
          continue;
        }
      }
    } catch (error) {
      console.warn('[RegionDetection] Geo-IP detection failed:', error);
    }

    return null;
  }

  private static detectFromLanguage(): RegionDetectionResult | null {
    if (typeof window === 'undefined') return null;

    const languages = navigator.languages || [navigator.language];
    
    for (const lang of languages) {
      const langCode = lang.split('-')[0]?.toLowerCase() || '';
      
      // Map language to market
      let marketKey: string | null = null;
      if (langCode === 'bg') marketKey = 'bg';
      else if (langCode === 'uk' || langCode === 'ua') marketKey = 'ua';
      else if (langCode === 'en') marketKey = 'eu';
      
      if (marketKey && REGIONAL_MARKETS[marketKey]) {
        const market = REGIONAL_MARKETS[marketKey];
        
        if (market) {
          return {
            locale: market.locale,
            currency: market.currency,
            market: market.market,
            confidence: 0.5,
            source: 'language',
          };
        }
      }
    }

    return null;
  }

  private static getDefaultRegion(): RegionDetectionResult {
    const market = REGIONAL_MARKETS.eu || REGIONAL_MARKETS.bg;
    
    if (!market) {
      // Ultra fallback
      return {
        locale: 'en',
        currency: 'EUR',
        market: 'eu',
        confidence: 0.3,
        source: 'default',
      };
    }
    
    return {
      locale: market.locale,
      currency: market.currency,
      market: market.market,
      confidence: 0.3,
      source: 'default',
    };
  }

  private static getCacheKey(request?: Request): string {
    if (!request) return 'default';
    
    const country = request.headers.get('cf-ipcountry') ||
                   request.headers.get('x-vercel-ip-country') ||
                   'unknown';
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
              request.headers.get('x-real-ip') ||
              'unknown';
    
    return `${country}-${ip.slice(0, 8)}`;
  }

  static saveRegionPreference(market: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('strike-shop-region', JSON.stringify({
        market,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('[RegionDetection] Failed to save region preference:', error);
    }
  }

  static getMarketConfig(market: string): RegionalMarketConfig | null {
    return REGIONAL_MARKETS[market] || null;
  }

  static getAllMarkets(): RegionalMarketConfig[] {
    return Object.values(REGIONAL_MARKETS);
  }
}

// Export convenience function for backward compatibility
export const detectUserRegion = () => RegionDetectionService.detectRegion();