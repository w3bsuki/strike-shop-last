/**
 * Strike Shop Design System Utilities
 * Balanced approach: Sharp content, rounded interactions
 */

import { cn } from '@/lib/utils';

/**
 * Design System Constants
 */
export const RADIUS = {
  none: 'rounded-none',      // 0 - Sharp edges
  xs: 'rounded-xs',          // 2px - Minimal softening
  sm: 'rounded-sm',          // 4px - Subtle rounding
  md: 'rounded-md',          // 6px - Medium rounding
  lg: 'rounded-lg',          // 8px - Standard rounding
  xl: 'rounded-xl',          // 12px - Large rounding
  '2xl': 'rounded-2xl',      // 16px - Extra large
  '3xl': 'rounded-3xl',      // 24px - Statement rounding
  full: 'rounded-full',      // Pills/circles
} as const;

/**
 * Component-specific radius mappings
 */
export const COMPONENT_RADIUS = {
  // Sharp (0) - Content & Structure
  card: RADIUS.none,
  productCard: RADIUS.none,
  categoryCard: RADIUS.none,
  image: RADIUS.none,
  section: RADIUS.none,
  table: RADIUS.none,
  
  // Rounded (8-12px) - Interactive Elements
  button: RADIUS.lg,
  buttonLarge: RADIUS.xl,
  input: RADIUS.md,
  select: RADIUS.md,
  checkbox: RADIUS.xs,
  switch: RADIUS.full,
  
  // Minimal (4-6px) - UI Elements
  dropdown: RADIUS.sm,
  tooltip: RADIUS.sm,
  popover: RADIUS.md,
  modal: RADIUS.lg,
  alert: RADIUS.md,
  toast: RADIUS.md,
  
  // Special - Brand Elements
  badge: RADIUS.full,
  avatar: RADIUS.full,
  iconButton: RADIUS.md,
  tag: RADIUS.sm,
} as const;

/**
 * Pre-built class combinations for common components
 */
export const COMPONENT_STYLES = {
  // Cards
  productCard: cn(
    'bg-white border border-gray-200',
    COMPONENT_RADIUS.productCard,
    'overflow-hidden transition-all duration-300',
    'hover:border-black hover:shadow-lg'
  ),
  
  categoryCard: cn(
    'bg-white border border-gray-200',
    COMPONENT_RADIUS.categoryCard,
    'overflow-hidden transition-all duration-300',
    'hover:border-black hover:shadow-lg'
  ),
  
  // Buttons
  primaryButton: cn(
    'bg-black text-white',
    COMPONENT_RADIUS.button,
    'px-6 py-3 font-medium',
    'hover:bg-gray-900 active:scale-[0.98]',
    'transition-all duration-150'
  ),
  
  secondaryButton: cn(
    'bg-white text-black border-2 border-black',
    COMPONENT_RADIUS.button,
    'px-6 py-3 font-medium',
    'hover:bg-gray-50 active:scale-[0.98]',
    'transition-all duration-150'
  ),
  
  // Inputs
  input: cn(
    'border border-gray-300',
    COMPONENT_RADIUS.input,
    'px-4 py-2.5',
    'focus:border-black focus:ring-2 focus:ring-black/5',
    'transition-colors duration-200'
  ),
  
  // Badges
  badge: cn(
    'inline-flex items-center',
    COMPONENT_RADIUS.badge,
    'px-3 py-1 text-xs font-medium'
  ),
} as const;

/**
 * Responsive radius helper
 * Increases radius slightly on mobile for better touch experience
 */
export function getResponsiveRadius(
  desktopRadius: keyof typeof RADIUS,
  mobileRadius?: keyof typeof RADIUS
): string {
  const mobile = mobileRadius || desktopRadius;
  return cn(RADIUS[desktopRadius], `max-md:${RADIUS[mobile]}`);
}

/**
 * Shadow utilities matching our elevation system
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;

/**
 * Animation duration utilities
 */
export const DURATION = {
  instant: 'duration-0',
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  slower: 'duration-500',
} as const;