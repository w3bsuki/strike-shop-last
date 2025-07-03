// Internationalization configuration for Strike Shop
// Supporting Bulgarian (BG), English (EN), and Ukrainian (UA)

export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'bg', 'ua'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

// Locale metadata for UI display
export const localeMetadata = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    currency: 'EUR', // Default to EUR for consistency
    region: 'Europe',
    hreflang: 'en',
  },
  bg: {
    name: 'Bulgarian',
    nativeName: 'Български',
    flag: '🇧🇬',
    dir: 'ltr',
    currency: 'BGN',
    region: 'Bulgaria',
    hreflang: 'bg',
  },
  ua: {
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    dir: 'ltr',
    currency: 'UAH',
    region: 'Ukraine',
    hreflang: 'uk',
  },
} as const;

// Shopify locale mapping
export const shopifyLocaleMap = {
  en: 'en-GB',
  bg: 'bg-BG',
  ua: 'uk-UA',
} as const;

// Currency preference by locale
export const localeCurrencyMap = {
  en: 'EUR',
  bg: 'BGN',
  ua: 'UAH',
} as const;

// RTL language detection
export function isRTL(locale: Locale): boolean {
  // Currently all supported locales are LTR
  // This function is here for future RTL support
  return false;
}

// Get locale from path
export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (i18n.locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }
  
  return null;
}

// Remove locale from path
export function removeLocaleFromPath(pathname: string, locale: Locale): string {
  if (pathname.startsWith(`/${locale}`)) {
    return pathname.slice(`/${locale}`.length) || '/';
  }
  return pathname;
}

// Add locale to path
export function addLocaleToPath(pathname: string, locale: Locale): string {
  // Remove any existing locale first
  const cleanPath = removeLocaleFromPath(pathname, getLocaleFromPath(pathname) || 'en');
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
}