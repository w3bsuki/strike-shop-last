// Define Currency type locally - only include currencies that are actually used
export type Currency = 'EUR' | 'BGN' | 'UAH' | 'USD';

export type PaymentMethodType = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'shop_pay'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'installments';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  icon?: string;
  available: boolean;
  description?: string;
}

export interface InstallmentOption {
  months: number;
  interestRate: number;
  minimumAmount: number;
  currency: Currency;
}

export interface RegionConfig {
  currencies: Currency[];
  defaultCurrency: Currency;
  paymentMethods: PaymentMethodType[];
  installmentOptions?: InstallmentOption[];
}

// Regional payment configurations
export const PAYMENT_REGIONS: Record<string, RegionConfig> = {
  EU: {
    currencies: ['EUR', 'BGN'],
    defaultCurrency: 'EUR',
    paymentMethods: [
      'credit_card',
      'debit_card',
      'paypal',
      'shop_pay',
      'apple_pay',
      'google_pay',
      'bank_transfer'
    ],
    installmentOptions: [
      { months: 3, interestRate: 0, minimumAmount: 100, currency: 'EUR' },
      { months: 6, interestRate: 0, minimumAmount: 200, currency: 'EUR' },
      { months: 12, interestRate: 2.5, minimumAmount: 500, currency: 'EUR' }
    ]
  },
  BG: {
    currencies: ['BGN', 'EUR'],
    defaultCurrency: 'BGN',
    paymentMethods: [
      'credit_card',
      'debit_card',
      'bank_transfer',
      'cash_on_delivery'
    ]
  },
  UA: {
    currencies: ['UAH', 'EUR', 'USD'],
    defaultCurrency: 'UAH',
    paymentMethods: [
      'credit_card',
      'debit_card',
      'bank_transfer',
      'cash_on_delivery'
    ]
  },
  US: {
    currencies: ['USD'],
    defaultCurrency: 'USD',
    paymentMethods: [
      'credit_card',
      'debit_card',
      'paypal',
      'shop_pay',
      'apple_pay',
      'google_pay'
    ],
    installmentOptions: [
      { months: 4, interestRate: 0, minimumAmount: 50, currency: 'USD' },
      { months: 6, interestRate: 0, minimumAmount: 100, currency: 'USD' },
      { months: 12, interestRate: 0, minimumAmount: 200, currency: 'USD' }
    ]
  }
};

// Currency exchange rates (in production, fetch from API)
export const EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1,
  BGN: 1.9558,
  UAH: 40.82,
  USD: 1.08
};

// Payment method display configuration
export const PAYMENT_METHOD_CONFIG: Record<PaymentMethodType, Omit<PaymentMethod, 'id' | 'available'>> = {
  credit_card: {
    name: 'Credit Card',
    type: 'credit_card',
    icon: '💳',
    description: 'Visa, Mastercard, American Express'
  },
  debit_card: {
    name: 'Debit Card',
    type: 'debit_card',
    icon: '💳',
    description: 'Direct payment from your bank account'
  },
  paypal: {
    name: 'PayPal',
    type: 'paypal',
    icon: '🅿️',
    description: 'Fast and secure payment'
  },
  shop_pay: {
    name: 'Shop Pay',
    type: 'shop_pay',
    icon: '🛍️',
    description: 'Save your info for faster checkout'
  },
  apple_pay: {
    name: 'Apple Pay',
    type: 'apple_pay',
    icon: '🍎',
    description: 'Pay with Touch ID or Face ID'
  },
  google_pay: {
    name: 'Google Pay',
    type: 'google_pay',
    icon: '🔵',
    description: 'Fast and secure Google payment'
  },
  bank_transfer: {
    name: 'Bank Transfer',
    type: 'bank_transfer',
    icon: '🏦',
    description: 'Direct bank-to-bank payment'
  },
  cash_on_delivery: {
    name: 'Cash on Delivery',
    type: 'cash_on_delivery',
    icon: '💵',
    description: 'Pay when you receive your order'
  },
  installments: {
    name: 'Pay in Installments',
    type: 'installments',
    icon: '📅',
    description: 'Split your payment over time'
  }
};

// Currency utilities
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount;
  
  const amountInEUR = amount / EXCHANGE_RATES[from];
  return amountInEUR * EXCHANGE_RATES[to];
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    EUR: '€',
    BGN: 'лв',
    UAH: '₴',
    USD: '$'
  };
  return symbols[currency] || currency;
}

export function getRegionFromCountry(countryCode: string): string {
  const countryToRegion: Record<string, string> = {
    BG: 'BG',
    UA: 'UA',
    US: 'US',
    DE: 'EU',
    FR: 'EU',
    IT: 'EU',
    ES: 'EU',
    NL: 'EU',
    BE: 'EU',
    AT: 'EU',
    PL: 'EU',
    RO: 'EU'
  };
  
  return countryToRegion[countryCode] || 'EU';
}

export function getAvailablePaymentMethodsForRegion(
  region: string,
  amount: number,
  currency: Currency
): PaymentMethod[] {
  const regionConfig = PAYMENT_REGIONS[region] || PAYMENT_REGIONS.EU;
  
  if (!regionConfig) {
    throw new Error(`No payment configuration found for region: ${region}`);
  }
  
  return regionConfig.paymentMethods.map(type => {
    const config = PAYMENT_METHOD_CONFIG[type];
    const method: PaymentMethod = {
      ...config,
      id: type,
      available: true
    };
    
    // Check if installments are available for this amount
    if (type === 'installments' && regionConfig.installmentOptions) {
      const availableOptions = regionConfig.installmentOptions.filter(
        option => option.currency === currency && amount >= option.minimumAmount
      );
      
      if (availableOptions.length === 0) {
        method.available = false;
        method.description = `Available for orders above ${formatCurrency(
          regionConfig.installmentOptions[0]?.minimumAmount || 100,
          currency
        )}`;
      } else {
        method.description = `Split into ${availableOptions.map(o => o.months).join(', ')} months`;
      }
    }
    
    return method;
  });
}

export function getInstallmentOptions(
  region: string,
  amount: number,
  currency: Currency
): InstallmentOption[] {
  const regionConfig = PAYMENT_REGIONS[region] || PAYMENT_REGIONS.EU;
  
  if (!regionConfig) {
    return [];
  }
  
  if (!regionConfig.installmentOptions) return [];
  
  return regionConfig.installmentOptions.filter(
    option => option.currency === currency && amount >= option.minimumAmount
  );
}

export function calculateInstallment(
  amount: number,
  months: number,
  interestRate: number
): number {
  if (interestRate === 0) {
    return amount / months;
  }
  
  const monthlyRate = interestRate / 100 / 12;
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return payment;
}