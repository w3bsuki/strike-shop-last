'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// BUNDLE OPTIMIZATION: Recharts is ~1MB - lazy load to reduce initial bundle
// This wrapper provides a loading state while Recharts loads
const ChartComponents = dynamic(
  () => import('./chart').then(mod => ({
    default: mod,
    ChartContainer: mod.ChartContainer,
    ChartTooltip: mod.ChartTooltip,
    ChartTooltipContent: mod.ChartTooltipContent,
    ChartLegend: mod.ChartLegend,
    ChartLegendContent: mod.ChartLegendContent,
    ChartStyle: mod.ChartStyle,
  })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-pulse space-y-2 w-full">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    ),
    ssr: false, // Charts don't need SSR
  }
);

// Re-export individual components for ease of use
export const ChartContainer = (props: any) => (
  <Suspense fallback={<div className="h-[300px] bg-gray-50 animate-pulse rounded" />}>
    <ChartComponents {...props} />
  </Suspense>
);

export const ChartTooltip = ChartComponents;
export const ChartTooltipContent = ChartComponents;
export const ChartLegend = ChartComponents;
export const ChartLegendContent = ChartComponents;
export const ChartStyle = ChartComponents;

// Export Recharts components through dynamic imports
export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false }
);

export const Line = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line })),
  { ssr: false }
);

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false }
);

export const Bar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar })),
  { ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { ssr: false }
);

export const Pie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie })),
  { ssr: false }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

export const XAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis })),
  { ssr: false }
);

export const YAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis })),
  { ssr: false }
);

export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { ssr: false }
);

export const Tooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  { ssr: false }
);

export const Legend = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Legend })),
  { ssr: false }
);

export const Area = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Area })),
  { ssr: false }
);

export const AreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { ssr: false }
);

export const RadarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.RadarChart })),
  { ssr: false }
);

export const Radar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Radar })),
  { ssr: false }
);

export const PolarGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PolarGrid })),
  { ssr: false }
);

export const PolarAngleAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PolarAngleAxis })),
  { ssr: false }
);

export const PolarRadiusAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PolarRadiusAxis })),
  { ssr: false }
);