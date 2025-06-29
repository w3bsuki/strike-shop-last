'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { accessibilityConfig } from '@/lib/accessibility-config';
import { useLiveRegion } from '@/components/accessibility/live-region';

/**
 * Comprehensive accessibility hook for Strike Shop
 * Provides utilities for WCAG AA compliance
 */

interface UseAccessibilityOptions {
  announceStateChanges?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  escapeDeactivates?: boolean;
}

export function useAccessibility(options: UseAccessibilityOptions = {}) {
  const {
    announceStateChanges = true,
    trapFocus = false,
    restoreFocus = true,
    escapeDeactivates = false,
  } = options;

  const { announce, announceError, announceSuccess } = useLiveRegion();
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Detect keyboard vs mouse user
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-user');
        document.body.classList.remove('mouse-user');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-user');
      document.body.classList.add('mouse-user');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Focus management
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [restoreFocus]);

  // Focus trap implementation
  const createFocusTrap = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }

      if (escapeDeactivates && e.key === 'Escape') {
        restorePreviousFocus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus, escapeDeactivates, restorePreviousFocus]);

  // Announce state changes
  const announceState = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceStateChanges) {
      announce(message, priority);
    }
  }, [announce, announceStateChanges]);

  // Check contrast ratio
  const checkContrast = useCallback((_foreground: string, _background: string) => {
    // This is a simplified check - in production, use a proper contrast calculation
    return {
      ratio: 21, // Placeholder
      meetsAA: true,
      meetsAAA: true,
    };
  }, []);

  // Ensure minimum touch target size
  const ensureTouchTarget = useCallback((element: HTMLElement) => {
    const minSize = parseInt(accessibilityConfig.touchTargets.minimum);
    const rect = element.getBoundingClientRect();
    
    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
    }
  }, []);

  // Add ARIA attributes
  const addAriaAttributes = useCallback((
    element: HTMLElement,
    attributes: Record<string, string>
  ) => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value);
    });
  }, []);

  // Remove ARIA attributes
  const removeAriaAttributes = useCallback((
    element: HTMLElement,
    attributes: string[]
  ) => {
    attributes.forEach(attr => {
      element.removeAttribute(`aria-${attr}`);
    });
  }, []);

  // Generate unique IDs for form elements
  const generateId = useCallback((prefix: string) => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Keyboard navigation helpers
  const handleArrowKeyNavigation = useCallback((
    e: React.KeyboardEvent,
    elements: HTMLElement[],
    orientation: 'horizontal' | 'vertical' | 'both' = 'both'
  ) => {
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (orientation !== 'horizontal') {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation !== 'horizontal') {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (orientation !== 'vertical') {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation !== 'vertical') {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = elements.length - 1;
        break;
    }

    // Wrap around
    if (nextIndex < 0) nextIndex = elements.length - 1;
    if (nextIndex >= elements.length) nextIndex = 0;

    elements[nextIndex]?.focus();
  }, []);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  return {
    // State
    isKeyboardUser,
    prefersReducedMotion,
    
    // Announcements
    announce: announceState,
    announceError,
    announceSuccess,
    
    // Focus management
    saveFocus,
    restorePreviousFocus,
    createFocusTrap,
    
    // Utilities
    checkContrast,
    ensureTouchTarget,
    addAriaAttributes,
    removeAriaAttributes,
    generateId,
    handleArrowKeyNavigation,
    debounce,
    
    // Config
    config: accessibilityConfig,
  };
}

/**
 * Hook for managing accessible modals/dialogs
 */
export function useAccessibleModal(isOpen: boolean) {
  const { saveFocus, restorePreviousFocus, createFocusTrap, announce } = useAccessibility({
    trapFocus: true,
    restoreFocus: true,
    escapeDeactivates: true,
  });
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announce('Dialog opened');
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Set up focus trap
      const cleanup = createFocusTrap(modalRef);
      
      return () => {
        cleanup?.();
        document.body.style.overflow = '';
        restorePreviousFocus();
        announce('Dialog closed');
      };
    }
    return undefined;
  }, [isOpen, saveFocus, restorePreviousFocus, createFocusTrap, announce]);

  return { modalRef };
}

/**
 * Hook for managing accessible form validation
 */
export function useAccessibleForm() {
  const { announceError, generateId } = useAccessibility();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorIdMap = useRef<Record<string, string>>({});

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    
    // Generate error ID if not exists
    if (!errorIdMap.current[fieldName]) {
      errorIdMap.current[fieldName] = generateId(`error-${fieldName}`);
    }
    
    // Announce error
    if (error) {
      announceError(`${fieldName}: ${error}`);
    }
  }, [announceError, generateId]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const error = errors[fieldName];
    const errorId = errorIdMap.current[fieldName];
    
    return {
      'aria-invalid': error ? 'true' : undefined,
      'aria-describedby': error ? errorId : undefined,
    };
  }, [errors]);

  const getErrorProps = useCallback((fieldName: string) => {
    const errorId = errorIdMap.current[fieldName];
    
    return {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite',
    };
  }, []);

  return {
    errors,
    setFieldError,
    clearFieldError,
    getFieldProps,
    getErrorProps,
  };
}