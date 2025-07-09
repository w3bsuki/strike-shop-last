'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';

const addressSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  address: z.object({
    line1: z.string().min(5, 'Address must be at least 5 characters'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State is required'),
    postal_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    country: z.string().min(2, 'Country is required'),
  }),
  sameAsShipping: z.boolean().optional(),
  shipping: z.object({
    name: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }),
  }).optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onComplete: (data: AddressFormData) => void;
  loading?: boolean;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export function AddressForm({ onComplete, loading }: AddressFormProps) {
  const [sameAsShipping, setSameAsShipping] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: {
        country: 'US',
      },
      sameAsShipping: true,
    },
    mode: 'onChange',
  });

  const onSubmit = (data: AddressFormData) => {
    // If shipping is same as billing, copy the address
    if (sameAsShipping) {
      data.shipping = {
        name: data.fullName,
        address: { ...data.address },
      };
    }
    
    onComplete(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            {...register('fullName')}
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
          )}
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing Address</h3>
        
        <div>
          <Label htmlFor="address.line1">Street Address *</Label>
          <Input
            id="address.line1"
            placeholder="123 Main Street"
            {...register('address.line1')}
            className={errors.address?.line1 ? 'border-destructive' : ''}
          />
          {errors.address?.line1 && (
            <p className="text-sm text-destructive mt-1">{errors.address.line1.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="address.line2">Apartment, Suite, etc. (Optional)</Label>
          <Input
            id="address.line2"
            placeholder="Apt 4B"
            {...register('address.line2')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address.city">City *</Label>
            <Input
              id="address.city"
              placeholder="New York"
              {...register('address.city')}
              className={errors.address?.city ? 'border-destructive' : ''}
            />
            {errors.address?.city && (
              <p className="text-sm text-destructive mt-1">{errors.address.city.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="address.state">State *</Label>
            <Select onValueChange={(value) => setValue('address.state', value)}>
              <SelectTrigger className={errors.address?.state ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.address?.state && (
              <p className="text-sm text-destructive mt-1">{errors.address.state.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address.postal_code">ZIP Code *</Label>
            <Input
              id="address.postal_code"
              placeholder="10001"
              {...register('address.postal_code')}
              className={errors.address?.postal_code ? 'border-destructive' : ''}
            />
            {errors.address?.postal_code && (
              <p className="text-sm text-destructive mt-1">{errors.address.postal_code.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="address.country">Country *</Label>
            <Select 
              defaultValue="US" 
              onValueChange={(value) => setValue('address.country', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sameAsShipping"
            checked={sameAsShipping}
            onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
          />
          <Label htmlFor="sameAsShipping" className="text-sm font-normal">
            Shipping address is the same as billing address
          </Label>
        </div>
        
        {!sameAsShipping && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Shipping Address</h3>
            
            <div>
              <Label htmlFor="shipping.name">Full Name *</Label>
              <Input
                id="shipping.name"
                placeholder="John Doe"
                {...register('shipping.name')}
              />
            </div>
            
            {/* Add similar fields for shipping address */}
            <p className="text-sm text-muted-foreground">
              Shipping address form would go here (similar to billing)
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button 
          type="submit" 
          size="lg" 
          className="w-full"
          disabled={!isValid || loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2" />
              Processing...
            </div>
          ) : (
            <>
              Continue to Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}