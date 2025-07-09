'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { 
  calculateFreeShippingProgress, 
  formatDeliveryEstimate,
  type ShippingRate 
} from '@/lib/shopify/shipping';
import { Progress } from '@/components/ui/progress';
import { Truck, Package, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to format price
const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

interface ShippingCalculatorProps {
  countryCode?: string;
  showFreeShippingProgress?: boolean;
  className?: string;
}

export function ShippingCalculator({
  countryCode = 'US',
  showFreeShippingProgress = true,
  className,
}: ShippingCalculatorProps) {
  const { cart } = useCart();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);

  useEffect(() => {
    const fetchShippingRates = async () => {
      if (!cart || cart.items.length === 0) return;

      setLoading(true);
      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryCode,
            subtotal: {
              amount: cart.items.reduce((sum, item) => sum + item.pricing.unitPrice * item.quantity, 0).toString(),
              currencyCode: 'USD'
            },
            weight: 1, // Default weight, should be calculated from products
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setShippingRates(data.rates);
          
          // Auto-select the first available rate
          const firstAvailable = data.rates.find((rate: ShippingRate) => rate.available);
          if (firstAvailable) {
            setSelectedRate(firstAvailable.method.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch shipping rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingRates();
  }, [cart, countryCode]);

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const subtotal = { 
    amount: cart.items.reduce((sum, item) => sum + item.pricing.totalPrice, 0).toString(),
    currencyCode: 'USD' as any
  };
  
  const freeShippingProgress = calculateFreeShippingProgress(
    subtotal,
    countryCode as any
  );

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'EXPRESS':
        return <Zap className="h-4 w-4" />;
      case 'PRIORITY':
        return <Package className="h-4 w-4" />;
      case 'ECONOMY':
        return <Clock className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Free Shipping Progress */}
      {showFreeShippingProgress && freeShippingProgress.remaining && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Free Shipping Progress</span>
            <span className="text-sm text-muted-foreground">
              {freeShippingProgress.percentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={freeShippingProgress.percentage} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            Add {formatPrice(parseFloat(freeShippingProgress.remaining?.amount || '0'))} more for free shipping
          </p>
        </div>
      )}

      {/* Shipping Methods */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Shipping Methods</h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {shippingRates.map((rate) => (
              <button
                key={rate.method.id}
                onClick={() => rate.available && setSelectedRate(rate.method.id)}
                disabled={!rate.available}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedRate === rate.method.id && 'border-primary bg-primary/5',
                  !rate.available && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-full',
                    selectedRate === rate.method.id ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    {getMethodIcon(rate.method.type)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{rate.method.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDeliveryEstimate(
                        rate.estimatedDelivery.min,
                        rate.estimatedDelivery.max
                      )}
                    </div>
                    {rate.message && (
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {rate.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {parseFloat(rate.price.amount) === 0 
                      ? 'Free' 
                      : formatPrice(parseFloat(rate.price.amount))}
                  </div>
                  {rate.method.carrier && (
                    <div className="text-xs text-muted-foreground">
                      via {rate.method.carrier.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Method Summary */}
      {selectedRate && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Selected shipping:</span>
            <span className="font-medium">
              {shippingRates.find(r => r.method.id === selectedRate)?.method.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}