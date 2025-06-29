import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for dynamic imports
const DefaultLoading = () => null;

// Chart components (recharts ~200KB)
export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false, loading: DefaultLoading }
);

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false, loading: DefaultLoading }
);

export const AreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { ssr: false, loading: DefaultLoading }
);

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { ssr: false, loading: DefaultLoading }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false, loading: DefaultLoading }
);

export const XAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const YAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Tooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Legend = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Legend as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Line = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Bar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Area = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Area as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Pie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

export const Cell = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Cell as any })),
  { ssr: false, loading: DefaultLoading }
) as any;

// Framer Motion components (~150KB)
export const motion = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion as any })),
  { ssr: false }
);

export const AnimatePresence = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

export const LazyMotion = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.LazyMotion })),
  { ssr: false }
);

// domAnimation is not a component, export it directly
export const domAnimation = import('framer-motion').then(mod => mod.domAnimation);

// Sanity Studio (~2MB) - commented out as sanity is not installed
// export const Studio = dynamic(
//   () => import('sanity').then(mod => ({ default: mod.Studio })),
//   { ssr: false, loading: () => null }
// );


// Heavy UI components
export const CommandDialog = dynamic(
  () => import('@/components/ui/command').then(mod => ({ default: mod.CommandDialog })),
  { ssr: false, loading: DefaultLoading }
);

export const Sheet = dynamic(
  () => import('@/components/ui/sheet').then(mod => ({ default: mod.Sheet })),
  { ssr: false, loading: DefaultLoading }
);

export const SheetContent = dynamic(
  () => import('@/components/ui/sheet').then(mod => ({ default: mod.SheetContent })),
  { ssr: false, loading: DefaultLoading }
);

export const SheetTrigger = dynamic(
  () => import('@/components/ui/sheet').then(mod => ({ default: mod.SheetTrigger })),
  { ssr: false, loading: DefaultLoading }
);

// Admin components
export const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard').then(mod => ({ default: mod.AdminDashboard })),
  { ssr: false, loading: () => null }
);

// Category page components
export const CategoryPageClient = dynamic(
  () => import('@/components/category/CategoryPageClient'),
  { ssr: false, loading: () => null }
);

// Product components (using existing components)
export const ProductGallery = dynamic(
  () => import('@/components/product/enhanced-product-gallery').then(mod => ({ default: mod.EnhancedProductGallery })),
  { ssr: false, loading: DefaultLoading }
);

export const ProductReviews = dynamic(
  () => import('@/components/product-reviews').then(mod => ({ default: mod.default || (() => null) })),
  { ssr: false, loading: DefaultLoading }
);

// Mobile components
export const MobileNav = dynamic(
  () => import('@/components/mobile/navigation').then(mod => ({ default: mod.MobileNav })),
  { ssr: false, loading: DefaultLoading }
);

export const MobileMenu = dynamic(
  () => import('@/components/mobile/utilities/mobile-drawer').then(mod => ({ default: mod.MobileDrawer })),
  { ssr: false, loading: DefaultLoading }
);

// Search components
export const SearchModal = dynamic(
  () => import('@/components/navigation/search-bar').then(mod => ({ default: mod.SearchBar })),
  { ssr: false, loading: DefaultLoading }
);

// Cart components
export const CartDrawer = dynamic(
  () => import('@/components/cart-sidebar').then(mod => ({ default: mod.default || (() => null) })),
  { ssr: false, loading: DefaultLoading }
);

// Checkout components
export const CheckoutForm = dynamic(
  () => import('@/components/checkout/enhanced-checkout-form').then(mod => ({ default: mod.EnhancedCheckoutForm })),
  { ssr: false, loading: DefaultLoading }
);

export const PaymentElement = dynamic(
  () => import('@stripe/react-stripe-js').then(mod => ({ default: mod.PaymentElement })),
  { ssr: false, loading: DefaultLoading }
);

// Rich text editor (placeholder for now)
export const RichTextEditor = dynamic(
  () => Promise.resolve({ default: () => null }),
  { ssr: false, loading: () => null }
);

// Map components (placeholder for now)
export const Map = dynamic(
  () => Promise.resolve({ default: () => null }),
  { ssr: false, loading: () => null }
);

// Helper to create dynamic imports with custom loading
export function createDynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    ssr?: boolean;
    loading?: () => JSX.Element | null;
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? DefaultLoading,
  });
}