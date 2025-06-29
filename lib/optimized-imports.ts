/**
 * OPTIMIZED IMPORTS CONFIGURATION
 * Provides tree-shaken imports for maximum bundle efficiency
 */

// Lucide React - Individual icon imports with proper tree-shaking
export { 
  Search,
  Menu,
  X,
  ShoppingCart,
  User as UserIcon,
  Heart,
  Star,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

// Radix UI - Specific component imports
export { 
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Content as DialogContent,
  Close as DialogClose,
  Portal as DialogPortal,
  Overlay as DialogOverlay
} from '@radix-ui/react-dialog';

export {
  Root as DropdownMenuRoot,
  Trigger as DropdownMenuTrigger,
  Content as DropdownMenuContent,
  Item as DropdownMenuItem,
  Separator as DropdownMenuSeparator
} from '@radix-ui/react-dropdown-menu';

export {
  Root as SelectRoot,
  Trigger as SelectTrigger,
  Content as SelectContent,
  Item as SelectItem,
  Value as SelectValue
} from '@radix-ui/react-select';

export { Slot } from '@radix-ui/react-slot';

// React Query - Tree-shaken imports
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Conditional React Query DevTools for development only
export const ReactQueryDevtools = process.env.NODE_ENV === 'development' 
  ? require('@tanstack/react-query-devtools').ReactQueryDevtools
  : () => null;


// Stripe - Tree-shaken imports
export { loadStripe } from '@stripe/stripe-js';
export { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Sanity - Production optimized imports (commented out until Sanity is installed)
// export { createClient } from '@sanity/client';
// export { urlFor } from 'next-sanity';

// Utility function to dynamically import icons
export const getIcon = async (iconName: string) => {
  try {
    const icons = await import('lucide-react') as any;
    const iconKey = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    return icons[iconKey] || null;
  } catch {
    return null;
  }
};

// Type-only imports for better tree-shaking
export type { NextPage } from 'next';
export type { Metadata } from 'next';
export type { IntegratedProduct } from '@/types/integrated';
