'use client';

import { useState } from 'react';
import { Calculator, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaxEstimate } from '@/lib/stores/slices/enhanced-cart';
import { formatPrice } from '@/lib/utils';

interface TaxEstimatorProps {
  onCalculate: (address: any) => void;
  isCalculating: boolean;
  estimate: TaxEstimate | null;
}

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
];

export function TaxEstimator({ onCalculate, isCalculating, estimate }: TaxEstimatorProps) {
  const [address, setAddress] = useState({
    country: 'US',
    state: '',
    postalCode: '',
    city: '',
  });

  const handleCalculate = () => {
    if (!address.country || !address.postalCode) {
      return;
    }
    onCalculate(address);
  };

  const isFormValid = address.country && address.postalCode;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        <h3 className="font-medium">Shipping & Tax Calculator</h3>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={address.country}
                onValueChange={(value) => setAddress(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  placeholder="12345"
                  value={address.postalCode}
                  onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!isFormValid || isCalculating}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Shipping & Tax
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Tax Estimate Results */}
      {estimate && (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <h4 className="font-medium text-sm">
                Estimate for {estimate.regionCode || 'Selected Region'}
              </h4>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(estimate.subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Tax ({((estimate.taxRate || 0) * 100).toFixed(1)}%)</span>
                <span>{formatPrice(estimate.taxAmount || estimate.tax)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping estimate</span>
                <span>
                  {(estimate.shippingEstimate || 0) > 0 
                    ? formatPrice(estimate.shippingEstimate || 0)
                    : 'Free'
                  }
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Estimated Total</span>
                <span>{formatPrice(estimate.total)}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
              <p className="flex items-start gap-1">
                <span className="text-amber-500">⚠️</span>
                This is an estimate. Final taxes and shipping will be calculated at checkout.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Location Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddress({ country: 'US', state: 'CA', postalCode: '90210', city: 'Beverly Hills' })}
        >
          US - CA
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddress({ country: 'GB', state: '', postalCode: 'SW1A 1AA', city: 'London' })}
        >
          UK - London
        </Button>
      </div>
    </div>
  );
}