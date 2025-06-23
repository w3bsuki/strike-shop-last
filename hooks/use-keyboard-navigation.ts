'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseKeyboardNavigationOptions {
  items: any[];
  onSelect?: (item: any, index: number) => void;
  onEscape?: () => void;
  orientation?: 'vertical' | 'horizontal' | 'grid';
  loop?: boolean;
  enabled?: boolean;
}

/**
 * Keyboard Navigation Hook
 * Provides arrow key navigation for lists and grids
 */
export function useKeyboardNavigation({
  items,
  onSelect,
  onEscape,
  orientation = 'vertical',
  loop = true,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const selectedIndex = useRef(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const focusItem = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.focus();
      selectedIndex.current = index;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || items.length === 0) return;

      const currentIndex = selectedIndex.current;
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
          }
          break;

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
          }
          break;

        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (onSelect) {
            onSelect(items[currentIndex], currentIndex);
          }
          break;

        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;

        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        focusItem(nextIndex);
      }
    },
    [enabled, items, orientation, loop, onSelect, onEscape, focusItem]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    selectedIndex: selectedIndex.current,
    setItemRef,
    focusItem,
    getItemProps: (index: number) => ({
      ref: setItemRef(index),
      tabIndex: index === selectedIndex.current ? 0 : -1,
      'data-selected': index === selectedIndex.current,
    }),
  };
}

/**
 * Roving Tab Index Hook
 * Implements roving tabindex pattern for composite widgets
 */
export function useRovingTabIndex(items: any[]) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
    },
    [items.length]
  );

  const getRovingProps = (index: number) => ({
    tabIndex: index === focusedIndex ? 0 : -1,
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    onFocus: () => setFocusedIndex(index),
  });

  return {
    focusedIndex,
    getRovingProps,
  };
}
