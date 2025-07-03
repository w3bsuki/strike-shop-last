'use client';

// Unified region context for multi-market e-commerce
// Integrates with existing i18n system and provides currency switching

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { type Locale } from '@/lib/i18n/config';
import { 
  RegionDetectionService, 
  type RegionDetectionResult, 
  type RegionalMarketConfig,
  REGIONAL_MARKETS 
} from './region-detection';

export interface RegionContextValue {
  // Current region state
  locale: Locale;
  currency: string;
  market: 'bg' | 'eu' | 'ua';
  marketConfig: RegionalMarketConfig;
  
  // Detection metadata
  confidence: number;
  source: string;
  
  // Actions
  changeRegion: (market: 'bg' | 'eu' | 'ua') => void;
  changeCurrency: (currency: string) => void;
  refreshRegion: () => Promise<void>;
  
  // Exchange rates (for price conversion display)
  exchangeRates: Record<string, number>;
  isLoadingRates: boolean;
  
  // Loading state
  isDetecting: boolean;
}

const RegionContext = createContext<RegionContextValue | null>(null);

export function useRegion(): RegionContextValue {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

interface RegionProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  request?: Request; // For server-side detection
}

export function RegionProvider({ 
  children, 
  initialLocale = 'en',
  request 
}: RegionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Region state
  const [regionState, setRegionState] = useState<RegionDetectionResult>(() => {
    // Initialize with default European market
    const defaultMarket = REGIONAL_MARKETS.eu || REGIONAL_MARKETS.bg;
    return {
      locale: initialLocale,
      currency: defaultMarket?.currency || 'EUR',
      market: defaultMarket?.market || 'eu',
      confidence: 0.1,
      source: 'default',
    };
  });
  
  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    BGN: 1,
    EUR: 1,
    UAH: 1,
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  
  // Loading state
  const [isDetecting, setIsDetecting] = useState(true);

  // Get current market configuration
  const marketConfig = REGIONAL_MARKETS[regionState.market] || REGIONAL_MARKETS.eu || REGIONAL_MARKETS.bg;

  // Initialize region detection
  useEffect(() => {
    let mounted = true;

    async function initializeRegion() {
      try {
        setIsDetecting(true);
        
        // Perform region detection
        const detectedRegion = await RegionDetectionService.detectRegion(request);
        
        if (!mounted) return;

        // Update state with detected region
        setRegionState(detectedRegion);
        
        // Load exchange rates for the detected currency
        await loadExchangeRates(detectedRegion.currency);
        
        console.log('[RegionProvider] Initialized:', {
          market: detectedRegion.market,
          locale: detectedRegion.locale,
          currency: detectedRegion.currency,
          confidence: detectedRegion.confidence,
          source: detectedRegion.source,
        });
        
      } catch (error) {
        console.error('[RegionProvider] Initialization failed:', error);
        
        // Fallback to European market on error
        if (mounted) {
          const fallback = REGIONAL_MARKETS.eu || REGIONAL_MARKETS.bg;
          setRegionState({
            locale: fallback?.locale || 'en',
            currency: fallback?.currency || 'EUR',
            market: fallback?.market || 'eu',
            confidence: 0.1,
            source: 'default',
          });
        }
      } finally {
        if (mounted) {
          setIsDetecting(false);
        }
      }
    }

    initializeRegion();

    return () => {
      mounted = false;
    };
  }, [request]);

  // Load exchange rates
  const loadExchangeRates = async (baseCurrency: string) => {
    try {
      setIsLoadingRates(true);
      
      // For production, you would use a real exchange rate API
      // For now, using mock exchange rates
      const mockRates = {
        BGN: baseCurrency === 'BGN' ? 1 : 0.51, // BGN to EUR ~0.51
        EUR: baseCurrency === 'EUR' ? 1 : (baseCurrency === 'BGN' ? 1.96 : 0.026), 
        UAH: baseCurrency === 'UAH' ? 1 : (baseCurrency === 'EUR' ? 38.5 : 19.6),
      };
      
      setExchangeRates(mockRates);
    } catch (error) {
      console.error('[RegionProvider] Failed to load exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Change region (market + locale + currency)
  const changeRegion = (market: 'bg' | 'eu' | 'ua') => {
    const newMarketConfig = REGIONAL_MARKETS[market];
    if (!newMarketConfig) {
      console.error('[RegionProvider] Invalid market:', market);
      return;
    }

    // Update region state
    const newRegionState: RegionDetectionResult = {
      locale: newMarketConfig.locale,
      currency: newMarketConfig.currency,
      market: newMarketConfig.market,
      confidence: 1.0,
      source: 'saved',
    };
    
    setRegionState(newRegionState);
    
    // Save preference
    RegionDetectionService.saveRegionPreference(market);
    
    // Load exchange rates for new currency
    loadExchangeRates(newMarketConfig.currency);
    
    // Navigate to new locale if needed
    if (newMarketConfig.locale !== regionState.locale) {
      const currentPath = pathname.split('/').slice(2).join('/'); // Remove /[lang]
      const newPath = `/${newMarketConfig.locale}${currentPath ? `/${currentPath}` : ''}`;
      router.push(newPath);
    }

    console.log('[RegionProvider] Region changed:', {
      market,
      locale: newMarketConfig.locale,
      currency: newMarketConfig.currency,
    });
  };

  // Change currency within same region (for cross-border shopping)
  const changeCurrency = (currency: string) => {
    // Validate currency
    const validCurrencies = ['BGN', 'EUR', 'UAH'];
    if (!validCurrencies.includes(currency)) {
      console.error('[RegionProvider] Invalid currency:', currency);
      return;
    }

    setRegionState(prev => ({
      ...prev,
      currency,
      confidence: 1.0,
      source: 'saved',
    }));
    
    // Load exchange rates for new currency
    loadExchangeRates(currency);
    
    console.log('[RegionProvider] Currency changed:', currency);
  };

  // Refresh region detection
  const refreshRegion = async () => {
    try {
      setIsDetecting(true);
      
      // Clear cache and re-detect
      const detectedRegion = await RegionDetectionService.detectRegion();
      
      setRegionState(detectedRegion);
      await loadExchangeRates(detectedRegion.currency);
      
      console.log('[RegionProvider] Region refreshed:', detectedRegion);
    } catch (error) {
      console.error('[RegionProvider] Failed to refresh region:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const contextValue: RegionContextValue = {
    // Current state
    locale: regionState.locale,
    currency: regionState.currency,
    market: regionState.market,
    marketConfig: marketConfig!,
    
    // Detection metadata
    confidence: regionState.confidence,
    source: regionState.source,
    
    // Actions
    changeRegion,
    changeCurrency,
    refreshRegion,
    
    // Exchange rates
    exchangeRates,
    isLoadingRates,
    
    // Loading
    isDetecting,
  };

  return (
    <RegionContext.Provider value={contextValue}>
      {children}
    </RegionContext.Provider>
  );
}

// Utility hook for region-aware formatting
export function useRegionFormatting() {
  const { currency, marketConfig, exchangeRates } = useRegion();

  const formatPrice = (amount: number, fromCurrency?: string): string => {
    let finalAmount = amount;
    
    // Convert currency if needed
    if (fromCurrency && fromCurrency !== currency && exchangeRates[currency]) {
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[currency] || 1;
      finalAmount = (amount / fromRate) * toRate;
    }

    // Format based on currency
    const formatter = new Intl.NumberFormat(
      marketConfig.locale === 'ua' ? 'uk-UA' : 
      marketConfig.locale === 'bg' ? 'bg-BG' : 'en-EU',
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );

    return formatter.format(finalAmount);
  };

  const formatNumber = (number: number): string => {
    const formatter = new Intl.NumberFormat(
      marketConfig.locale === 'ua' ? 'uk-UA' : 
      marketConfig.locale === 'bg' ? 'bg-BG' : 'en-EU'
    );

    return formatter.format(number);
  };

  return {
    formatPrice,
    formatNumber,
    currency,
    marketConfig,
  };
}