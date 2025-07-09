'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getAvailableCountries, getAvailableCurrencies } from '@/lib/shopify/markets-client';
import { cn } from '@/lib/utils';

interface MarketSelectorProps {
  currentCountry?: string;
  currentCurrency?: string;
  className?: string;
}

export function MarketSelector({ 
  currentCountry = 'DE', 
  currentCurrency = 'EUR',
  className 
}: MarketSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selectedCountry, setSelectedCountry] = useState(currentCountry);
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);

  const countries = getAvailableCountries();
  const currencies = getAvailableCurrencies();

  // Find current selections
  const currentCountryData = countries.find(c => c.code === selectedCountry);
  const currentCurrencyData = currencies.find(c => c.code === selectedCurrency);

  // Update URL when selection changes
  const updateMarket = async (countryCode: string, currencyCode: string) => {
    startTransition(() => {
      // Save preferences to cookies via API route
      fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          country: countryCode, 
          currency: currencyCode 
        }),
      }).then(() => {
        // Refresh the page to apply new market context
        router.refresh();
      });
    });
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(countryCode);
      setSelectedCurrency(country.currency);
      updateMarket(countryCode, country.currency);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    updateMarket(selectedCountry, currencyCode);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Country Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            disabled={isPending}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">
              {currentCountryData?.name || selectedCountry}
            </span>
            <span className="sm:hidden">{selectedCountry}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Select Country</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {countries.map((country) => (
            <DropdownMenuItem
              key={country.code}
              onClick={() => handleCountryChange(country.code)}
              className={cn(
                "cursor-pointer",
                country.code === selectedCountry && "font-semibold"
              )}
            >
              <span className="flex-1">{country.name}</span>
              <span className="text-muted-foreground text-xs">
                {country.code}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            disabled={isPending}
          >
            <span>{currentCurrencyData?.symbol || selectedCurrency}</span>
            <span className="hidden sm:inline">{selectedCurrency}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {currencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={cn(
                "cursor-pointer justify-between",
                currency.code === selectedCurrency && "font-semibold"
              )}
            >
              <span>{currency.symbol}</span>
              <span>{currency.code}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Server component wrapper to get initial values from cookies
export async function MarketSelectorServer() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  const country = cookieStore.get('shopify_country')?.value || 'DE';
  const currency = cookieStore.get('shopify_currency')?.value || 'EUR';
  
  return (
    <MarketSelector 
      currentCountry={country} 
      currentCurrency={currency} 
    />
  );
}