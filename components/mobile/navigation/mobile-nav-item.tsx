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
    'min-h-[44px] min-w-[44px] p-2 touch-manipulation',
    'relative group',
    // Ensure proper tap target size
    'after:absolute after:inset-0 after:min-h-[44px] after:min-w-[44px]'
  );

  const variantStyles = {
    default: cn(
      'text-muted-foreground hover:text-foreground',
      isActive && 'text-foreground'
    ),
    minimal: cn(
      'text-muted-foreground hover:text-foreground',
      isActive && 'text-foreground'
    ),
    floating: cn(
      'text-primary-foreground/80 hover:text-primary-foreground',
      isActive && 'text-primary-foreground'
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
            variant === 'default' && 'bottom-0 bg-foreground',
            variant === 'minimal' && 'bottom-0 bg-foreground',
            variant === 'floating' && 'bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-foreground'
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