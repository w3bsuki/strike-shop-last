/**
 * Dynamic Import Examples for Heavy Components
 * Use these patterns to reduce initial bundle size
 */

import dynamic from 'next/dynamic';

// ========================================
// Admin Dashboard Components
// ========================================

// Dynamic import for charts (recharts is ~300KB)
export const DynamicLineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  }
);

export const DynamicBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  }
);

export const DynamicPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  }
);

// ========================================
// Sanity Studio Components
// ========================================

// Dynamic import for Sanity Studio (saves ~2MB from initial bundle) - commented out as sanity is not installed
// export const DynamicStudio = dynamic(
//   () => import('sanity').then(mod => ({ default: mod.Studio })),
//   {
//     
//     loading: () => (
//       <div className="flex items-center justify-center h-screen">
//         <div className="flex flex-col items-center gap-4">
//           <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
//           <p className="text-sm text-muted-foreground">Loading Studio...</p>
//         </div>
//       </div>
//     ),
//   }
// );

// ========================================
// Heavy UI Components
// ========================================

// Dynamic import for carousel - removed as component was unused

// Dynamic import for date picker - commented out as date-picker component doesn't exist
// export const DynamicDatePicker = dynamic(
//   () => import('@/components/ui/date-picker').then(mod => ({ default: mod.DatePicker })),
//   {
//     
//     loading: () => <div className="h-10 w-[280px] animate-pulse bg-muted rounded" />,
//   }
// );

// ========================================
// Usage Examples
// ========================================

/**
 * Before (imports everything immediately):
 * import { LineChart, BarChart } from 'recharts';
 * 
 * After (loads only when needed):
 * import { DynamicLineChart, DynamicBarChart } from '@/lib/dynamic-imports';
 */

/**
 * For page-level dynamic imports:
 * 
 * const AdminDashboard = dynamic(
 *   () => import('@/components/admin/AdminDashboard'),
 *   {
 *     
 *     loading: () => <AdminDashboardSkeleton />,
 *   }
 * );
 */

/**
 * Best practices:
 * 1. Use dynamic imports for components > 50KB
 * 2. Always provide a loading state
 * 3. Set  for client-only components
 * 4. Group related dynamic imports together
 * 5. Preload critical dynamic components with next/dynamic's preload
 */
