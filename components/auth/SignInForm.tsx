'use client';

import type React from 'react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignInFormProps {
  formData: {
    email: string;
    password: string;
  };
  setFormData: (data: { email: string; password: string }) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export function SignInForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--subtle-text-color)]" />
        <Input
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="search-input pl-10"
          autoComplete="email"
          enterKeyHint="next"
          required
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
          autoComplete="current-password"
          enterKeyHint="done"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--subtle-text-color)] min-h-touch min-w-touch flex items-center justify-center -mt-5"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full !py-3"
      >
        {isLoading ? 'Please wait...' : 'Sign In'}
      </Button>
    </form>
  );
}
