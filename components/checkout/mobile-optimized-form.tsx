'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check } from 'lucide-react';

interface ValidationRule {
  pattern?: RegExp;
  message: string;
  required?: boolean;
}

const validationRules: Record<string, ValidationRule> = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
    required: true,
  },
  postal_code: {
    pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    message: 'Please enter a valid UK postcode',
    required: true,
  },
  phone: {
    pattern: /^[\d\s\-\+\(\)]+$/,
    message: 'Please enter a valid phone number',
    required: false,
  },
};

interface FieldError {
  field: string;
  message: string;
}

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone: string;
}

interface MobileOptimizedFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function MobileOptimizedForm({ onSubmit, isLoading = false }: MobileOptimizedFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    postal_code: '',
    country_code: 'GB',
    phone: '',
  });

  const [errors, setErrors] = useState<FieldError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = (field: string, value: string): string | null => {
    const rule = validationRules[field];
    if (!rule) return null;

    if (rule.required && !value.trim()) {
      return 'This field is required';
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      return rule.message;
    }

    return null;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    const error = validateField(field, formData[field as keyof FormData]);
    
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== field);
      if (error) {
        return [...filtered, { field, message: error }];
      }
      return filtered;
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation for touched fields
    if (touched.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => {
        const filtered = prev.filter(e => e.field !== field);
        if (error) {
          return [...filtered, { field, message: error }];
        }
        return filtered;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FieldError[] = [];
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof FormData]);
      if (error) {
        newErrors.push({ field, message: error });
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setTouched(new Set(Object.keys(formData)));
      
      // Scroll to first error
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    onSubmit(formData);
  };

  const getFieldError = (field: string) => errors.find(e => e.field === field)?.message;
  const hasFieldError = (field: string) => touched.has(field) && !!getFieldError(field);
  const isFieldValid = (field: string) => touched.has(field) && !getFieldError(field) && formData[field as keyof FormData];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="relative">
          <Input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`min-h-[48px] text-base pr-10 ${hasFieldError('email') ? 'border-destructive' : ''}`}
            autoComplete="email"
            inputMode="email"
            data-error={hasFieldError('email')}
          />
          {isFieldValid('email') && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
          )}
          {hasFieldError('email') && (
            <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{getFieldError('email')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="First name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              onBlur={() => handleBlur('first_name')}
              className="min-h-[48px] text-base"
              autoComplete="given-name"
            />
            <Input
              placeholder="Last name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              onBlur={() => handleBlur('last_name')}
              className="min-h-[48px] text-base"
              autoComplete="family-name"
            />
          </div>

          <Input
            placeholder="Address"
            value={formData.address_1}
            onChange={(e) => handleChange('address_1', e.target.value)}
            onBlur={() => handleBlur('address_1')}
            className="min-h-[48px] text-base"
            autoComplete="address-line1"
          />

          <Input
            placeholder="Apartment, suite, etc. (optional)"
            value={formData.address_2}
            onChange={(e) => handleChange('address_2', e.target.value)}
            className="min-h-[48px] text-base"
            autoComplete="address-line2"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              onBlur={() => handleBlur('city')}
              className="min-h-[48px] text-base"
              autoComplete="address-level2"
            />
            <div className="relative">
              <Input
                placeholder="Postcode"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('postal_code')}
                className={`min-h-[48px] text-base pr-10 ${hasFieldError('postal_code') ? 'border-destructive' : ''}`}
                autoComplete="postal-code"
                inputMode="text"
                data-error={hasFieldError('postal_code')}
              />
              {isFieldValid('postal_code') && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
              )}
              {hasFieldError('postal_code') && (
                <div className="flex items-center gap-1 mt-1 text-sm text-destructive absolute">
                  <AlertCircle className="h-4 w-4" />
                  <span>{getFieldError('postal_code')}</span>
                </div>
              )}
            </div>
          </div>

          <select
            value={formData.country_code}
            onChange={(e) => handleChange('country_code', e.target.value)}
            className="w-full min-h-[48px] text-base px-4 border rounded-md"
            autoComplete="country"
          >
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </select>

          <div className="relative">
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              className={`min-h-[48px] text-base ${hasFieldError('phone') ? 'border-destructive' : ''}`}
              autoComplete="tel"
              inputMode="tel"
            />
            {hasFieldError('phone') && (
              <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{getFieldError('phone')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || errors.length > 0}
        className="w-full min-h-[56px] text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </form>
  );
}