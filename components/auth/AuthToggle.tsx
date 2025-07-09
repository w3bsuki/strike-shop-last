'use client';

import type React from 'react';

interface AuthToggleProps {
  mode: 'login' | 'register';
  onToggle: () => void;
}

export function AuthToggle({ mode, onToggle }: AuthToggleProps) {
  return (
    <div className="text-center mt-6">
      <p className="text-sm text-[var(--subtle-text-color)]">
        {mode === 'login'
          ? "Don't have an account?"
          : 'Already have an account?'}{' '}
        <button onClick={onToggle} className="font-bold hover:underline">
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
