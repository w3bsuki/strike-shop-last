'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { Locale } from './config';
import type { Dictionary } from './dictionaries';

interface I18nContextType {
  locale: Locale;
  dictionary: Dictionary;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  // Type-safe translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Navigate through nested object using dot notation
    const keys = key.split('.');
    let value: any = dictionary;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for locale: ${locale}`);
        return key; // Return key if not found
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key} for locale: ${locale}`);
      return key;
    }
    
    // Handle parameter interpolation
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, val]) => str.replace(new RegExp(`{${paramKey}}`, 'g'), String(val)),
        value
      );
    }
    
    return value;
  };

  const contextValue: I18nContextType = {
    locale,
    dictionary,
    t,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n context
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
}

// Hook for just the translation function
export function useTranslations() {
  const { t } = useI18n();
  return t;
}

// Hook for locale information
export function useLocale() {
  const { locale } = useI18n();
  return locale;
}