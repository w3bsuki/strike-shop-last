'use client';

import { useState, useEffect } from 'react';
import { getCurrencySymbol, type Currency } from '@/lib/shopify/payment-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderIcon } from 'lucide-react';

interface CurrencySelectorProps {
  currentCurrency: string;
  availableCurrencies: string[];
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

export function CurrencySelector({
  currentCurrency,
  availableCurrencies,
  onCurrencyChange,
  className,
}: CurrencySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCurrencyChange = async (value: string) => {
    const newCurrency = value as string;
    if (newCurrency === currentCurrency) return;
    
    setIsLoading(true);
    try {
      onCurrencyChange(newCurrency);
      // Store preference in localStorage
      localStorage.setItem('preferredCurrency', newCurrency);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load saved preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency') as string;
    if (savedCurrency && availableCurrencies.includes(savedCurrency) && savedCurrency !== currentCurrency) {
      onCurrencyChange(savedCurrency);
    }
  }, [availableCurrencies, currentCurrency, onCurrencyChange]);

  return (
    <div className={className}>
      <Select 
        value={currentCurrency}
        onValueChange={handleCurrencyChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
          {isLoading && <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />}
        </SelectTrigger>
        <SelectContent>
          {availableCurrencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency.toUpperCase()}
              <span className="ml-2 text-gray-500">{getCurrencySymbol(currency as Currency)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}