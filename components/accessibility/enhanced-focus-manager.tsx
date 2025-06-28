'use client';

import React, { useEffect, useRef, useCallback, createContext, useContext } from 'react';

/**
 * Enhanced Focus Management System
 * Implements WCAG 2.1 AA compliant focus management patterns
 */

interface FocusManagerContextType {
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => () => void;
  restoreFocus: (element?: HTMLElement) => void;
  setFocusedElement: (element: HTMLElement) => void;
  moveFocus: (direction: 'next' | 'previous' | 'first' | 'last') => void;
}

const FocusManagerContext = createContext<FocusManagerContextType | null>(null);

export function useFocusManager() {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManagerProvider');
  }
  return context;
}

interface FocusManagerProviderProps {
  children: React.ReactNode;
}

export function FocusManagerProvider({ children }: FocusManagerProviderProps) {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const currentTrap = useRef<(() => void) | null>(null);

  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details',
      'summary',
      '[contenteditable="true"]'
    ].join(',');

    return Array.from(container.querySelectorAll(focusableSelector)).filter(
      (element) => {
        const el = element as HTMLElement;
        return el.offsetParent !== null && !el.hidden && el.style.display !== 'none';
      }
    ) as HTMLElement[];
  }, []);

  const trapFocus = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return () => {};

    // Store the previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return () => {};

    // Focus the first element
    focusableElements[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusableElements = getFocusableElements(container);
      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [getFocusableElements]);

  const restoreFocus = useCallback((element?: HTMLElement) => {
    const targetElement = element || previouslyFocusedElement.current;
    if (targetElement && typeof targetElement.focus === 'function') {
      targetElement.focus();
    }
    previouslyFocusedElement.current = null;
  }, []);

  const setFocusedElement = useCallback((element: HTMLElement) => {
    previouslyFocusedElement.current = element;
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const focusableElements = getFocusableElements(document.body);
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

    let targetIndex: number;
    switch (direction) {
      case 'next':
        targetIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'previous':
        targetIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      case 'first':
        targetIndex = 0;
        break;
      case 'last':
        targetIndex = focusableElements.length - 1;
        break;
      default:
        return;
    }

    if (focusableElements[targetIndex]) {
      focusableElements[targetIndex]?.focus();
    }
  }, [getFocusableElements]);

  useEffect(() => {
    return () => {
      if (currentTrap.current) {
        currentTrap.current();
      }
    };
  }, []);

  const value: FocusManagerContextType = {
    trapFocus,
    restoreFocus,
    setFocusedElement,
    moveFocus,
  };

  return (
    <FocusManagerContext.Provider value={value}>
      {children}
    </FocusManagerContext.Provider>
  );
}

/**
 * Enhanced Focus Trap Hook
 * Implements focus trapping for modals and overlays
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const { trapFocus, restoreFocus } = useFocusManager();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      cleanupRef.current = trapFocus(containerRef);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (isActive) {
        restoreFocus();
      }
    };
  }, [isActive, trapFocus, restoreFocus]);

  return containerRef;
}

/**
 * Enhanced Focus Indicator Component
 * Provides visible focus indicators that meet WCAG AA standards
 */
interface FocusIndicatorProps {
  children: React.ReactNode;
  className?: string;
  outline?: 'thin' | 'thick';
  color?: 'primary' | 'secondary' | 'danger';
}

export function FocusIndicator({ 
  children, 
  className = '', 
  outline = 'thick',
  color = 'primary' 
}: FocusIndicatorProps) {
  const focusStyles = {
    thin: 'focus-visible:outline-2 focus-visible:outline-offset-2',
    thick: 'focus-visible:outline-4 focus-visible:outline-offset-2',
  };

  const colorStyles = {
    primary: 'focus-visible:outline-primary',
    secondary: 'focus-visible:outline-secondary',
    danger: 'focus-visible:outline-destructive',
  };

  return (
    <div 
      className={`
        ${focusStyles[outline]} 
        ${colorStyles[color]}
        focus-visible:outline-solid
        focus-visible:outline
        rounded-none
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Skip Navigation Component
 * Enhanced skip links for keyboard navigation
 */
interface SkipNavItem {
  href: string;
  label: string;
}

interface SkipNavigationProps {
  links: SkipNavItem[];
  className?: string;
}

export function SkipNavigation({ links, className = '' }: SkipNavigationProps) {
  return (
    <nav 
      aria-label="Skip navigation" 
      className={`sr-only focus-within:not-sr-only ${className}`}
    >
      <ul className="fixed top-4 left-4 z-[9999] bg-background border-2 border-primary p-2 space-y-1">
        {links.map((link, index) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              tabIndex={index === 0 ? 0 : -1}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Keyboard Navigation Helper Hook
 * Enhanced keyboard navigation with ARIA support
 */
export function useEnhancedKeyboardNavigation<T>(
  items: T[],
  options: {
    onSelect?: (item: T, index: number) => void;
    onEscape?: () => void;
    orientation?: 'horizontal' | 'vertical' | 'grid';
    loop?: boolean;
    disabled?: boolean;
  } = {}
) {
  const {
    onSelect,
    onEscape,
    orientation = 'vertical',
    loop = true,
    disabled = false
  } = options;

  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback((index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const focusItem = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.focus();
      setFocusedIndex(index);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (disabled || items.length === 0) return;

    let nextIndex = currentIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          handled = true;
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = loop ? 0 : items.length - 1;
          }
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          handled = true;
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? items.length - 1 : 0;
          }
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          handled = true;
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = loop ? 0 : items.length - 1;
          }
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          handled = true;
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? items.length - 1 : 0;
          }
        }
        break;

      case 'Home':
        handled = true;
        nextIndex = 0;
        break;

      case 'End':
        handled = true;
        nextIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        if (onSelect) {
          handled = true;
          onSelect(items[currentIndex], currentIndex);
        }
        break;

      case 'Escape':
        if (onEscape) {
          handled = true;
          onEscape();
        }
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      
      if (nextIndex !== currentIndex) {
        focusItem(nextIndex);
      }
    }
  }, [disabled, items, orientation, loop, onSelect, onEscape, focusItem]);

  return {
    focusedIndex,
    setItemRef,
    focusItem,
    handleKeyDown,
    getItemProps: (index: number) => ({
      ref: setItemRef(index),
      tabIndex: index === focusedIndex ? 0 : -1,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
      onFocus: () => setFocusedIndex(index),
      'data-focused': index === focusedIndex,
      'aria-selected': index === focusedIndex,
    }),
  };
}