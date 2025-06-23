'use client';

import { useEffect, useState } from 'react';

/**
 * Enhanced Keyboard Navigation for Perfect Accessibility
 * 
 * Provides comprehensive keyboard navigation support across the entire site
 * with visual focus indicators and smooth scrolling.
 */

export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    // Detect keyboard usage
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    // Enhanced keyboard shortcuts
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      ) {
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;

        case 'c':
          if (e.metaKey || e.ctrlKey) return; // Don't interfere with copy
          e.preventDefault();
          // Focus cart
          const cartButton = document.querySelector('[aria-label*="cart" i]') as HTMLElement;
          if (cartButton) {
            cartButton.click();
          }
          break;

        case 'w':
          if (e.metaKey || e.ctrlKey) return; // Don't interfere with close window
          e.preventDefault();
          // Navigate to wishlist
          const wishlistLink = document.querySelector('a[href="/wishlist"]') as HTMLElement;
          if (wishlistLink) {
            wishlistLink.click();
          }
          break;

        case 'h':
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          // Navigate to home
          window.location.href = '/';
          break;

        case 'Escape':
          // Close any open modals or menus
          const closeButtons = document.querySelectorAll('[aria-label*="close" i], [data-dismiss]');
          closeButtons.forEach(button => {
            if (button instanceof HTMLElement && button.offsetParent !== null) {
              button.click();
            }
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Add focus-visible support
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-user');
    } else {
      document.body.classList.remove('keyboard-user');
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isKeyboardUser]);

  return { isKeyboardUser };
}

/**
 * Enhanced Focus Trap for Modals
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, containerRef]);
}

/**
 * Skip Link Component for Better Accessibility
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded focus:shadow-lg transition-all"
    >
      Skip to main content
    </a>
  );
}

/**
 * Keyboard Shortcuts Help Modal
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts = [
    { key: '/', description: 'Focus search' },
    { key: 'C', description: 'Open cart' },
    { key: 'W', description: 'Go to wishlist' },
    { key: 'H', description: 'Go to home' },
    { key: 'Esc', description: 'Close modals/menus' },
    { key: 'Tab', description: 'Navigate forward' },
    { key: 'Shift + Tab', description: 'Navigate backward' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-[90%]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close shortcuts help"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex justify-between items-center py-1">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{key}</kbd>
              <span className="text-sm text-gray-600">{description}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          Press <kbd className="px-1 bg-gray-100 rounded">?</kbd> to show/hide this help
        </div>
      </div>
    </div>
  );
}