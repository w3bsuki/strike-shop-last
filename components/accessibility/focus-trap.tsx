'use client';

import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  returnFocus?: boolean;
}

/**
 * Focus Trap Component
 * Traps focus within a container for accessible modals/dialogs
 */
export function FocusTrap({
  children,
  active = true,
  className = '',
  returnFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the current active element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => {
        // Check if element is visible
        return el.offsetParent !== null;
      });
    };

    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Trap focus
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);

      // Return focus to previous element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, returnFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
