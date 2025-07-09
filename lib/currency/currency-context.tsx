'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Supported currencies based on .env.example
export type SupportedCurrency = 'EUR' | 'USD' | 'BGN' | 'UAH';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  BGN: {
    code: 'BGN',
    symbol: 'лв',
    name: 'Bulgarian Lev',
    flag: '🇧🇬',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  UAH: {
    code: 'UAH',
    symbol: '₴',
    name: 'Ukrainian Hryvnia',
    flag: '🇺🇦',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
};

// Country to currency mapping for geo-detection
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  // European Union
  'AT': 'EUR', 'BE': 'EUR', 'BG': 'BGN', 'HR': 'EUR', 'CY': 'EUR',
  'CZ': 'EUR', 'DK': 'EUR', 'EE': 'EUR', 'FI': 'EUR', 'FR': 'EUR',
  'DE': 'EUR', 'GR': 'EUR', 'HU': 'EUR', 'IE': 'EUR', 'IT': 'EUR',
  'LV': 'EUR', 'LT': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'NL': 'EUR',
  'PL': 'EUR', 'PT': 'EUR', 'RO': 'EUR', 'SK': 'EUR', 'SI': 'EUR',
  'ES': 'EUR', 'SE': 'EUR',
  
  // Americas
  'US': 'USD', 'CA': 'USD', 'MX': 'USD',
  
  // Eastern Europe
  'UA': 'UAH', 'BY': 'UAH', 'MD': 'UAH',
  
  // Default fallback for EU countries
  'EU': 'EUR',
};

interface CurrencyContextType {
  currency: SupportedCurrency;
  currencyInfo: CurrencyInfo;
  setCurrency: (currency: SupportedCurrency) => void;
  formatPrice: (amount: number, showSymbol?: boolean) => string;
  convertPrice: (amount: number, fromCurrency: SupportedCurrency) => Promise<number>;
  isLoading: boolean;
  exchangeRates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: SupportedCurrency;
}

export function CurrencyProvider({ children, defaultCurrency }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(
    defaultCurrency || (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY as SupportedCurrency) || 'EUR'
  );
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Detect user's currency based on enhanced region detection
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Import region detection service dynamically to avoid SSR issues
        const { detectUserRegion } = await import('@/lib/region/region-detection');
        
        // Use enhanced region detection
        const regionResult = await detectUserRegion();
        
        console.log('Region detection result:', regionResult);
        
        // Apply detected currency if confidence is reasonable
        if (regionResult.confidence > 0.3 && regionResult.currency !== currency) {
          setCurrencyState(regionResult.currency as SupportedCurrency);
          
          // Save detected region preferences
          localStorage.setItem('strike-shop-currency', regionResult.currency);
          localStorage.setItem('strike-shop-locale', regionResult.locale);
          localStorage.setItem('strike-shop-market', regionResult.market);
        }
      } catch (error) {
        console.warn('Enhanced currency detection failed:', error);
        
        // Fallback to simple detection
        const savedCurrency = localStorage.getItem('strike-shop-currency') as SupportedCurrency;
        if (savedCurrency && CURRENCIES[savedCurrency]) {
          setCurrencyState(savedCurrency);
        }
      } finally {
        setIsLoading(false);
      }
    };

    detectCurrency();
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        // Use a free exchange rate API
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/EUR`
        );
        
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates:', error);
        // Set fallback rates
        setExchangeRates({
          EUR: 1,
          USD: 1.1,
          BGN: 1.96,
          UAH: 40.5,
        });
      }
    };

    fetchExchangeRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setCurrency = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('strike-shop-currency', newCurrency);
    
    // Track currency change for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'currency_change', {
        new_currency: newCurrency,
        previous_currency: currency,
      });
    }
  };

  const formatPrice = (amount: number, showSymbol: boolean = true): string => {
    const currencyInfo = CURRENCIES[currency];
    
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency,
        minimumFractionDigits: currencyInfo.decimalPlaces,
        maximumFractionDigits: currencyInfo.decimalPlaces,
      });

      if (showSymbol) {
        return formatter.format(amount);
      } else {
        // Custom formatting for better control
        const formatted = formatter.format(amount);
        return `${currencyInfo.symbol}${formatted}`;
      }
    } catch (error) {
      // Fallback formatting
      const rounded = amount.toFixed(currencyInfo.decimalPlaces);
      return showSymbol ? `${currencyInfo.symbol}${rounded}` : rounded;
    }
  };

  const convertPrice = async (amount: number, fromCurrency: SupportedCurrency): Promise<number> => {
    if (fromCurrency === currency) {
      return amount;
    }

    try {
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[currency] || 1;
      
      // Convert to EUR base, then to target currency
      const eurAmount = amount / fromRate;
      const convertedAmount = eurAmount * toRate;
      
      return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.warn('Currency conversion failed:', error);
      return amount; // Return original amount if conversion fails
    }
  };

  const value: CurrencyContextType = {
    currency,
    currencyInfo: CURRENCIES[currency],
    setCurrency,
    formatPrice,
    convertPrice,
    isLoading,
    exchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Utility hooks for common operations
export function usePrice(baseAmount: number, baseCurrency: SupportedCurrency = 'EUR') {
  const { convertPrice, formatPrice, isLoading } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number>(baseAmount);

  useEffect(() => {
    const convert = async () => {
      const converted = await convertPrice(baseAmount, baseCurrency);
      setConvertedAmount(converted);
    };

    convert();
  }, [baseAmount, baseCurrency, convertPrice]);

  return {
    amount: convertedAmount,
    formatted: formatPrice(convertedAmount),
    isLoading,
  };
}