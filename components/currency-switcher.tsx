'use client';

import { useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency, CURRENCIES, SupportedCurrency } from '@/lib/currency/currency-context';
import { cn } from '@/lib/utils';

interface CurrencySwitcherProps {
  variant?: 'default' | 'minimal' | 'compact' | 'mobile';
  className?: string;
  showFlag?: boolean;
  showLabel?: boolean;
}

export function CurrencySwitcher({
  variant = 'default',
  className,
  showFlag = true,
  showLabel = true,
}: CurrencySwitcherProps) {
  const { currency, currencyInfo, setCurrency, isLoading } = useCurrency();
  const [open, setOpen] = useState(false);

  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency);
    setOpen(false);
  };

  const triggerContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className="flex items-center space-x-1">
            {showFlag && <span className="text-sm">{currencyInfo.flag}</span>}
            <span className="font-medium">{currencyInfo.code}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        );
      
      case 'compact':
        return (
          <div className="flex items-center space-x-1">
            <span className="font-mono text-sm">{currencyInfo.symbol}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        );
      
      case 'mobile':
        return (
          <div className="flex items-center space-x-1">
            <span className="text-sm">{currencyInfo.flag}</span>
            <span className="font-medium text-sm">{currencyInfo.code}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        );
      
      default:
        return (
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            {showFlag && <span>{currencyInfo.flag}</span>}
            <span className="font-medium">{currencyInfo.code}</span>
            {showLabel && (
              <span className="hidden sm:inline text-muted-foreground">
                ({currencyInfo.symbol})
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        );
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' || variant === 'mobile' ? 'sm' : 'default'}
          className={cn(
            'h-auto p-2',
            variant === 'compact' && 'h-8 px-2',
            variant === 'mobile' && 'h-8 px-3',
            className
          )}
          disabled={isLoading}
        >
          {triggerContent()}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center">
          <Globe className="mr-2 h-4 w-4" />
          Currency & Region
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.values(CURRENCIES).map((currencyOption) => (
          <DropdownMenuItem
            key={currencyOption.code}
            onClick={() => handleCurrencyChange(currencyOption.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{currencyOption.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{currencyOption.name}</span>
                <span className="text-sm text-muted-foreground">
                  {currencyOption.code} ({currencyOption.symbol})
                </span>
              </div>
            </div>
            {currency === currencyOption.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Exchange rates updated</span>
            <span>1 hour ago</span>
          </div>
          <div className="mt-1 text-center">
            Prices automatically converted from EUR
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile/tight spaces
export function CurrencySwitcherCompact(props: Omit<CurrencySwitcherProps, 'variant'>) {
  return <CurrencySwitcher {...props} variant="compact" />;
}

// Minimal version for headers
export function CurrencySwitcherMinimal(props: Omit<CurrencySwitcherProps, 'variant'>) {
  return <CurrencySwitcher {...props} variant="minimal" />;
}

// Currency display component (non-interactive)
interface CurrencyDisplayProps {
  amount: number;
  originalCurrency?: SupportedCurrency;
  className?: string;
  showOriginal?: boolean;
}

export function CurrencyDisplay({
  amount,
  originalCurrency = 'EUR',
  className,
  showOriginal = false,
}: CurrencyDisplayProps) {
  const { formatPrice, convertPrice, currency } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);

  useState(() => {
    const convert = async () => {
      if (originalCurrency !== currency) {
        const converted = await convertPrice(amount, originalCurrency);
        setConvertedAmount(converted);
      } else {
        setConvertedAmount(amount);
      }
    };
    convert();
  });

  return (
    <div className={cn('flex items-baseline space-x-2', className)}>
      <span className="font-semibold">{formatPrice(convertedAmount)}</span>
      {showOriginal && originalCurrency !== currency && (
        <span className="text-sm text-muted-foreground line-through">
          {CURRENCIES[originalCurrency].symbol}{amount.toFixed(2)}
        </span>
      )}
    </div>
  );
}

// Price comparison component
interface PriceComparisonProps {
  prices: Array<{
    currency: SupportedCurrency;
    amount: number;
    label?: string;
  }>;
  className?: string;
}

export function PriceComparison({ prices, className }: PriceComparisonProps) {
  const { currency: currentCurrency } = useCurrency();

  const currentPrice = prices.find(p => p.currency === currentCurrency);
  const otherPrices = prices.filter(p => p.currency !== currentCurrency);

  if (!currentPrice) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-lg font-semibold">
        <CurrencyDisplay
          amount={currentPrice.amount}
          originalCurrency={currentPrice.currency}
        />
      </div>
      
      {otherPrices.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Compare prices in other currencies
          </summary>
          <div className="mt-2 space-y-1">
            {otherPrices.map((price) => (
              <div key={price.currency} className="flex justify-between">
                <span className="flex items-center space-x-2">
                  <span>{CURRENCIES[price.currency].flag}</span>
                  <span>{price.label || CURRENCIES[price.currency].name}</span>
                </span>
                <span className="font-mono">
                  {CURRENCIES[price.currency].symbol}{price.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}