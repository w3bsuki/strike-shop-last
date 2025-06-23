'use client';

import type React from 'react';
import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignUpFormProps {
  formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    newsletter: boolean;
  };
  setFormData: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    newsletter: boolean;
  }) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export function SignUpForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
          <Input
            type="text"
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className="search-input pl-10"
            required
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
          <Input
            type="text"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className="search-input pl-10"
            required
          />
        </div>
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
        <Input
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="search-input pl-10"
          required
        />
      </div>

      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
        <Input
          type="tel"
          placeholder="Phone number (optional)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="search-input pl-10"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="search-input pl-10 pr-10"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--subtle-text-color)]"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="newsletter"
          checked={formData.newsletter}
          onChange={(e) =>
            setFormData({ ...formData, newsletter: e.target.checked })
          }
          className="h-4 w-4"
        />
        <label
          htmlFor="newsletter"
          className="text-sm text-[var(--subtle-text-color)]"
        >
          Subscribe to newsletter for exclusive offers
        </label>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full !py-3"
      >
        {isLoading ? 'Please wait...' : 'Create Account'}
      </Button>

      <div className="text-center mt-4">
        <p className="text-xs text-[var(--subtle-text-color)]">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="underline hover:no-underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:no-underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </form>
  );
}
