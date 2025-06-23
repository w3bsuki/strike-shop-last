/**
 * OPTIMIZED IMPORTS CONFIGURATION
 * Provides tree-shaken imports for maximum bundle efficiency
 */

// Lucide React - Individual icon imports for perfect tree-shaking
export { Search } from 'lucide-react/dist/esm/icons/search';
export { Menu } from 'lucide-react/dist/esm/icons/menu';
export { X } from 'lucide-react/dist/esm/icons/x';
export { ShoppingCart } from 'lucide-react/dist/esm/icons/shopping-cart';
export { User } from 'lucide-react/dist/esm/icons/user';
export { Heart } from 'lucide-react/dist/esm/icons/heart';
export { Star } from 'lucide-react/dist/esm/icons/star';
export { Plus } from 'lucide-react/dist/esm/icons/plus';
export { Minus } from 'lucide-react/dist/esm/icons/minus';
export { ChevronDown } from 'lucide-react/dist/esm/icons/chevron-down';
export { ChevronUp } from 'lucide-react/dist/esm/icons/chevron-up';
export { ChevronLeft } from 'lucide-react/dist/esm/icons/chevron-left';
export { ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right';
export { Filter } from 'lucide-react/dist/esm/icons/filter';
export { SlidersHorizontal } from 'lucide-react/dist/esm/icons/sliders-horizontal';
export { Grid3X3 } from 'lucide-react/dist/esm/icons/grid-3x3';
export { List } from 'lucide-react/dist/esm/icons/list';
export { Trash2 } from 'lucide-react/dist/esm/icons/trash-2';
export { Edit } from 'lucide-react/dist/esm/icons/edit';
export { Eye } from 'lucide-react/dist/esm/icons/eye';
export { EyeOff } from 'lucide-react/dist/esm/icons/eye-off';
export { Check } from 'lucide-react/dist/esm/icons/check';
export { AlertCircle } from 'lucide-react/dist/esm/icons/alert-circle';
export { Info } from 'lucide-react/dist/esm/icons/info';
export { Loader2 } from 'lucide-react/dist/esm/icons/loader-2';

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

// Clerk - Specific imports only
export { useUser, useAuth, SignIn, SignUp, UserButton } from '@clerk/nextjs';

// Stripe - Tree-shaken imports
export { loadStripe } from '@stripe/stripe-js';
export { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Sanity - Production optimized imports
export { createClient } from '@sanity/client';
export { urlFor } from 'next-sanity';

// Utility function to dynamically import icons
export const getIcon = (iconName: string) => {
  return import(`lucide-react/dist/esm/icons/${iconName.toLowerCase()}`)
    .then(module => module.default || module)
    .catch(() => null);
};

// Type-only imports for better tree-shaking
export type { NextPage } from 'next';
export type { Metadata } from 'next';
export type { IntegratedProduct } from '@/types/integrated';
export type { User } from '@clerk/nextjs/server';