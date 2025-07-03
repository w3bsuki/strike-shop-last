'use client';

// Advanced region and currency switcher component
// Supports multiple display variants and regional business logic

import { useState, useEffect } from 'react';
import { useRegion, useRegionFormatting } from '@/lib/region/region-context';
import { REGIONAL_MARKETS } from '@/lib/region/region-detection';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  MapPin, 
  CreditCard, 
  Truck, 
  Calculator, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface RegionSwitcherProps {
  variant?: 'default' | 'minimal' | 'compact';
  showConfidence?: boolean;
  showBusinessInfo?: boolean;
  className?: string;
}

export function RegionSwitcher({ 
  variant = 'default',
  showConfidence = false,
  showBusinessInfo = false,
  className = '' 
}: RegionSwitcherProps) {
  const { 
    locale, 
    currency, 
    market, 
    marketConfig, 
    confidence,
    source,
    changeRegion,
    changeCurrency,
    refreshRegion,
    isDetecting,
    exchangeRates,
    isLoadingRates
  } = useRegion();
  
  const { formatPrice } = useRegionFormatting();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('region');

  // Get regional display info
  const getMarketDisplay = (marketKey: string) => {
    const config = REGIONAL_MARKETS[marketKey];
    const flags = {
      bg: '🇧🇬',
      eu: '🇪🇺', 
      ua: '🇺🇦'
    };
    
    const names = {
      bg: 'Bulgaria',
      eu: 'Europe',
      ua: 'Ukraine'
    };

    // Fallback if config is undefined
    if (!config) {
      return {
        flag: flags[marketKey as keyof typeof flags] || '🌍',
        name: names[marketKey as keyof typeof names] || marketKey,
        currency: 'EUR',
        locale: 'en',
        config: null
      };
    }

    return {
      flag: flags[marketKey as keyof typeof flags],
      name: names[marketKey as keyof typeof names],
      currency: config.currency,
      locale: config.locale,
      config
    };
  };

  // Get confidence indicator
  const getConfidenceIndicator = () => {
    if (confidence >= 0.9) return { icon: CheckCircle2, color: 'text-green-500', label: 'High' };
    if (confidence >= 0.7) return { icon: CheckCircle2, color: 'text-yellow-500', label: 'Medium' };
    if (confidence >= 0.5) return { icon: AlertCircle, color: 'text-orange-500', label: 'Low' };
    return { icon: AlertCircle, color: 'text-red-500', label: 'Very Low' };
  };

  // Minimal variant
  if (variant === 'minimal') {
    const currentMarket = getMarketDisplay(market);
    
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`h-8 px-2 ${className}`}>
            <span className="mr-1">{currentMarket.flag}</span>
            <span className="text-xs font-medium">{currency}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Region & Currency</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.keys(REGIONAL_MARKETS).map((marketKey) => {
            const marketDisplay = getMarketDisplay(marketKey);
            return (
              <DropdownMenuItem
                key={marketKey}
                onClick={() => changeRegion(marketKey as 'bg' | 'eu' | 'ua')}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span>{marketDisplay.flag}</span>
                  <span className="text-sm">{marketDisplay.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {marketDisplay.currency}
                </Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    const currentMarket = getMarketDisplay(market);
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-3"
        >
          <Globe className="w-3 h-3 mr-1" />
          <span className="text-xs">{currentMarket.flag} {currency}</span>
        </Button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 p-2">
            <div className="grid grid-cols-3 gap-1">
              {Object.keys(REGIONAL_MARKETS).map((marketKey) => {
                const marketDisplay = getMarketDisplay(marketKey);
                return (
                  <Button
                    key={marketKey}
                    variant={marketKey === market ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      changeRegion(marketKey as 'bg' | 'eu' | 'ua');
                      setIsOpen(false);
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    {marketDisplay.flag}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant (full featured)
  const currentMarket = getMarketDisplay(market);
  const confidenceIndicator = getConfidenceIndicator();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`min-w-[140px] justify-between ${className}`}>
          <div className="flex items-center space-x-2">
            <span>{currentMarket.flag}</span>
            <div className="text-left">
              <div className="text-sm font-medium">{currentMarket.name}</div>
              <div className="text-xs text-muted-foreground">{currency}</div>
            </div>
          </div>
          {isDetecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Region & Currency</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshRegion()}
              disabled={isDetecting}
            >
              <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {showConfidence && (
            <div className="flex items-center space-x-2 mt-2">
              <confidenceIndicator.icon className={`w-4 h-4 ${confidenceIndicator.color}`} />
              <span className="text-xs text-muted-foreground">
                Detection: {confidenceIndicator.label} ({Math.round(confidence * 100)}%) • {source}
              </span>
            </div>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-2 mr-4">
            <TabsTrigger value="region">Region</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="region" className="p-4 pt-0">
            <div className="space-y-3">
              {Object.keys(REGIONAL_MARKETS).map((marketKey) => {
                const marketDisplay = getMarketDisplay(marketKey);
                const isSelected = marketKey === market;
                
                return (
                  <Card 
                    key={marketKey}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => changeRegion(marketKey as 'bg' | 'eu' | 'ua')}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <span className="text-lg">{marketDisplay.flag}</span>
                          <span>{marketDisplay.name}</span>
                        </CardTitle>
                        <Badge variant={isSelected ? "default" : "secondary"}>
                          {marketDisplay.currency}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    {showBusinessInfo && (
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calculator className="w-3 h-3" />
                            <span>{marketDisplay.config?.taxInclusive ? 'Tax incl.' : 'Tax excl.'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Truck className="w-3 h-3" />
                            <span>{marketDisplay.config?.shippingZones?.length || 0} zones</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CreditCard className="w-3 h-3" />
                            <span>{marketDisplay.config?.paymentMethods?.length || 0} methods</span>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="currency" className="p-4 pt-0">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Change display currency (prices will be converted)
              </div>
              
              {['BGN', 'EUR', 'UAH'].map((curr) => {
                const isSelected = curr === currency;
                const rate = exchangeRates[curr] || 1;
                const samplePrice = formatPrice(100, currency);
                
                return (
                  <Card
                    key={curr}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => changeCurrency(curr)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{curr}</div>
                          <div className="text-xs text-muted-foreground">
                            Example: {formatPrice(100, curr)}
                          </div>
                        </div>
                        {isLoadingRates ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="text-right">
                            <div className="text-sm">{rate.toFixed(4)}</div>
                            <div className="text-xs text-muted-foreground">rate</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified region indicator for headers/nav
export function RegionIndicator({ className = '' }: { className?: string }) {
  const { market, currency } = useRegion();
  const currentMarket = REGIONAL_MARKETS[market];
  
  const flags = {
    bg: '🇧🇬',
    eu: '🇪🇺', 
    ua: '🇺🇦'
  };

  return (
    <div className={`flex items-center space-x-1 text-sm ${className}`}>
      <span>{flags[market]}</span>
      <span className="font-medium">{currency}</span>
    </div>
  );
}

// Region-aware price display component
export function RegionPrice({ 
  amount, 
  fromCurrency,
  className = '',
  showOriginal = false 
}: { 
  amount: number;
  fromCurrency?: string;
  className?: string;
  showOriginal?: boolean;
}) {
  const { formatPrice } = useRegionFormatting();
  const { currency } = useRegion();
  
  const displayPrice = formatPrice(amount, fromCurrency);
  const originalPrice = fromCurrency && fromCurrency !== currency ? 
    formatPrice(amount, fromCurrency) : null;

  return (
    <div className={className}>
      <span className="font-medium">{displayPrice}</span>
      {showOriginal && originalPrice && originalPrice !== displayPrice && (
        <span className="text-xs text-muted-foreground ml-1">
          (~{originalPrice})
        </span>
      )}
    </div>
  );
}