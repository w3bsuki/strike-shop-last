'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/auth-store';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { AuthToggle } from './auth-toggle';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | undefined;
}

/**
 * AuthModal - Now using shadcn Dialog for consistency
 * 
 * IMPROVEMENTS:
 * - Standardized on shadcn Dialog component
 * - Better accessibility with built-in ARIA attributes and focus management
 * - Enhanced keyboard navigation (ESC key, tab trapping)
 * - Consistent animations and backdrop handling
 * - Maintained exact same styling and social login functionality
 * - Screen reader improvements with proper dialog semantics
 */
export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    newsletter: true,
  });

  const { login, register, socialLogin, isLoading } = useAuthStore();

  const handleSubmit = async (_e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'login') {
        const success = await login(formData.email, formData.password);
        if (success) onClose();
      } else {
        const success = await register({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        });
        if (success) onClose();
      }
    } catch (_error) {
      // Error handled by auth store
    }
  };

  const handleSocialLogin = async (
    _provider: 'google' | 'apple' | 'facebook'
  ) => {
    try {
      const success = await socialLogin(provider);
      if (success) onClose();
    } catch (_error) {
      // Error handled by auth store
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="w-full max-w-md border-0 rounded-none p-8"
        // Preserve Strike design system sharp edges
        style={{ borderRadius: 0 }}
      >
        <DialogHeader className="text-center mb-8">
          <DialogTitle className="text-2xl font-bold uppercase tracking-wider mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--subtle-text-color)]">
            {mode === 'login'
              ? 'Sign in to your Strike™ account'
              : 'Join the Strike™ community'}
          </DialogDescription>
        </DialogHeader>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full border border-subtle hover:border-black bg-white text-black !py-3"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          <Button
            onClick={() => handleSocialLogin('apple')}
            disabled={isLoading}
            className="w-full border border-subtle hover:border-black bg-white text-black !py-3"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continue with Apple
          </Button>
          <Button
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className="w-full border border-subtle hover:border-black bg-white text-black !py-3"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-subtle" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[var(--subtle-text-color)]">
              or
            </span>
          </div>
        </div>

        {/* Form */}
        {mode === 'login' ? (
          <SignInForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        ) : (
          <SignUpForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}

        {/* Footer */}
        <AuthToggle mode={mode} onToggle={toggleMode} />
      </DialogContent>
    </Dialog>
  );
}
