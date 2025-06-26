'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileScrollLock } from './mobile-scroll-lock';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'full';
  showHandle?: boolean;
  closeOnOutsideClick?: boolean;
  className?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'bottom',
  size = 'md',
  showHandle = true,
  closeOnOutsideClick = true,
  className,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeDown: position === 'bottom' ? handleClose : undefined,
    onSwipeLeft: position === 'right' ? handleClose : undefined,
    onSwipeRight: position === 'left' ? handleClose : undefined,
    threshold: 100,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const sizeClasses = {
    sm: {
      bottom: 'h-1/3',
      left: 'w-3/4 max-w-sm',
      right: 'w-3/4 max-w-sm',
    },
    md: {
      bottom: 'h-1/2',
      left: 'w-4/5 max-w-md',
      right: 'w-4/5 max-w-md',
    },
    lg: {
      bottom: 'h-3/4',
      left: 'w-11/12 max-w-lg',
      right: 'w-11/12 max-w-lg',
    },
    full: {
      bottom: 'h-full',
      left: 'w-full',
      right: 'w-full',
    },
  };

  const positionClasses = {
    bottom: cn(
      'bottom-0 left-0 right-0',
      'rounded-t-2xl',
      isOpen ? 'translate-y-0' : 'translate-y-full'
    ),
    left: cn(
      'top-0 left-0 bottom-0',
      'rounded-r-2xl',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ),
    right: cn(
      'top-0 right-0 bottom-0',
      'rounded-l-2xl',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    ),
  };

  return (
    <>
      <MobileScrollLock isLocked={isOpen} />

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeOnOutsideClick ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed z-50 bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden',
          positionClasses[position],
          sizeClasses[size][position],
          className
        )}
        {...swipeHandlers}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Mobile drawer'}
      >
        {/* Handle */}
        {showHandle && position === 'bottom' && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || position !== 'bottom') && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'overflow-y-auto',
            title || position !== 'bottom' ? 'p-4' : 'px-4 pb-4',
            position === 'bottom' && 'pb-safe' // Safe area for iOS
          )}
          style={{
            maxHeight: title || position !== 'bottom' 
              ? 'calc(100% - 64px)' 
              : showHandle 
              ? 'calc(100% - 32px)' 
              : '100%',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}