'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  PaymentMethod, 
  PaymentMethodType,
  getInstallmentOptions,
  calculateInstallment,
  formatCurrency,
  type Currency
} from '@/lib/shopify/payment-config';
import {
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  Calendar,
  Shield,
  Check
} from 'lucide-react';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  amount: number;
  currency: string;
  region: string;
  selectedMethod?: PaymentMethodType;
  onMethodSelect?: (method: PaymentMethodType) => void;
}

const paymentIcons: Record<PaymentMethodType, React.ReactNode> = {
  credit_card: <CreditCard className="h-5 w-5" />,
  debit_card: <CreditCard className="h-5 w-5" />,
  paypal: <div className="font-bold text-blue-600">PP</div>,
  shop_pay: <div className="font-bold text-purple-600">SP</div>,
  apple_pay: <Smartphone className="h-5 w-5" />,
  google_pay: <div className="font-bold text-blue-500">G</div>,
  bank_transfer: <Building className="h-5 w-5" />,
  cash_on_delivery: <Banknote className="h-5 w-5" />,
  installments: <Calendar className="h-5 w-5" />
};

export function PaymentMethods({
  methods,
  amount,
  currency,
  region,
  selectedMethod,
  onMethodSelect
}: PaymentMethodsProps) {
  const [showInstallmentDetails, setShowInstallmentDetails] = useState(false);
  const installmentOptions = getInstallmentOptions(region, amount, currency as Currency);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Methods</h3>
      
      <div className="grid gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.type;
          const Icon = paymentIcons[method.type];
          
          return (
            <div key={method.id}>
              <button
                onClick={() => {
                  if (method.available && onMethodSelect) {
                    onMethodSelect(method.type);
                    if (method.type === 'installments') {
                      setShowInstallmentDetails(!showInstallmentDetails);
                    }
                  }
                }}
                disabled={!method.available}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                  method.available
                    ? "hover:border-primary cursor-pointer"
                    : "opacity-50 cursor-not-allowed",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                    {Icon}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{method.name}</p>
                    {method.description && (
                      <p className="text-sm text-gray-500">{method.description}</p>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </button>
              
              {/* Installment details */}
              {method.type === 'installments' && isSelected && showInstallmentDetails && installmentOptions.length > 0 && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                  <p className="text-sm font-medium">Available installment plans:</p>
                  {installmentOptions.map((option) => {
                    const monthlyPayment = calculateInstallment(amount, option.months, option.interestRate);
                    const totalAmount = monthlyPayment * option.months;
                    
                    return (
                      <div key={option.months} className="flex justify-between items-center p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium">{option.months} months</p>
                          <p className="text-sm text-gray-500">
                            {option.interestRate > 0 ? `${option.interestRate}% APR` : 'Interest-free'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(monthlyPayment, currency as Currency)}/mo</p>
                          {option.interestRate > 0 && (
                            <p className="text-sm text-gray-500">
                              Total: {formatCurrency(totalAmount, currency as Currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Security badges */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="font-semibold text-black">Shopify Payments</span>
          </div>
        </div>
        
        {/* Accepted cards */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">We accept:</span>
          <div className="flex gap-2">
            <img src="/visa.svg" alt="Visa" className="h-8" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-8" />
            <img src="/amex.svg" alt="American Express" className="h-8" />
            <img src="/paypal.svg" alt="PayPal" className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}