'use client';

import { ReactNode, MouseEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface MobileNavItemProps {
  href?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
  as?: 'link' | 'button';
  variant?: 'default' | 'minimal' | 'floating';
}

export function MobileNavItem({
  href,
  onClick,
  children,
  className,
  isActive = false,
  disabled = false,
  as = 'link',
  variant = 'default',
}: MobileNavItemProps) {
  const { triggerHaptic } = useHapticFeedback();

  const handleClick = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (!disabled) {
      triggerHaptic('light');
      onClick?.(e);
    }
  };

  const baseStyles = cn(
    'flex flex-col items-center justify-center transition-colors duration-base',
    'min-h-space-11 min-w-space-11 p-space-2 touch-manipulation',
    'relative group',
    // Ensure proper tap target size
    'after:absolute after:inset-0 after:min-h-space-11 after:min-w-space-11'
  );

  const variantStyles = {
    default: cn(
      'text-strike-gray-600 hover:text-strike-black',
      isActive && 'text-strike-black'
    ),
    minimal: cn(
      'text-strike-gray-500 hover:text-strike-gray-900',
      isActive && 'text-strike-black'
    ),
    floating: cn(
      'text-strike-white/80 hover:text-strike-white',
      isActive && 'text-strike-white'
    ),
  };

  const disabledStyles = disabled && 'opacity-50 cursor-not-allowed';

  const content = (
    <>
      {children}
      {/* Active indicator */}
      {isActive && (
        <div
          className={cn(
            'absolute inset-x-0 h-[2px] transition-all duration-base',
            variant === 'default' && 'bottom-0 bg-strike-black',
            variant === 'minimal' && 'bottom-0 bg-strike-black',
            variant === 'floating' && 'bottom-space-1 left-1/2 -translate-x-1/2 w-space-1 h-space-1 bg-strike-white'
          )}
        />
      )}
    </>
  );

  if (as === 'button' || !href) {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          disabledStyles,
          className
        )}
        aria-pressed={isActive}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        baseStyles,
        variantStyles[variant],
        disabledStyles,
        className
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}