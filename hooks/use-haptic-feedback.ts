'use client';

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 25,
  medium: 50,
  heavy: 100,
  success: [30, 50, 30],
  warning: [50, 100, 50],
  error: [100, 50, 100, 50],
};

export function useHapticFeedback() {
  const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;

  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported) return;

    try {
      const vibrationPattern = hapticPatterns[pattern];
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [isSupported]);

  return {
    triggerHaptic,
    isSupported,
  };
}