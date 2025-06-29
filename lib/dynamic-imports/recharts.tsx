import dynamic from 'next/dynamic';
import React from 'react';

// Loading component for charts
const ChartLoading = () => (
  <div className="flex h-[350px] w-full items-center justify-center">
    <div className="animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Export recharts components directly (not as dynamic imports)
// These are not standalone React components but configuration components
export { 
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  Sector,
  RadialBar,
  Pie,
  Dot,
  Brush,
  Radar,
  Scatter,
  LabelList,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// Dynamic imports for Recharts components
export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer })),
  { loading: () => <ChartLoading />,  }
);

export const LineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { loading: () => <ChartLoading />,  }
);

// Line is exported directly above, not as a dynamic import

export const BarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart })),
  { loading: () => <ChartLoading />,  }
);

// Bar is exported directly above, not as a dynamic import

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart })),
  { loading: () => <ChartLoading />,  }
);

// Area is exported directly above, not as a dynamic import

export const PieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart })),
  { loading: () => <ChartLoading />,  }
);

// Pie is exported directly above, not as a dynamic import

export const RadarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadarChart })),
  { loading: () => <ChartLoading />,  }
);

// Radar is exported directly above, not as a dynamic import

export const RadialBarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadialBarChart })),
  { loading: () => <ChartLoading />,  }
);

// RadialBar is exported directly above, not as a dynamic import

export const ComposedChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ComposedChart })),
  { loading: () => <ChartLoading />,  }
);

export const ScatterChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ScatterChart })),
  { loading: () => <ChartLoading />,  }
);

// Scatter is exported directly above, not as a dynamic import

// XAxis is exported directly above, not as a dynamic import

// YAxis is exported directly above, not as a dynamic import

// ZAxis is exported directly above, not as a dynamic import

// CartesianGrid is exported directly above, not as a dynamic import

// Tooltip is exported directly above, not as a dynamic import

// Legend is exported directly above, not as a dynamic import

// Cell is exported directly above, not as a dynamic import

// LabelList is exported directly above, not as a dynamic import

// ReferenceLine is exported directly above, not as a dynamic import

// ReferenceArea is exported directly above, not as a dynamic import

// ReferenceDot is exported directly above, not as a dynamic import

// Brush is exported directly above, not as a dynamic import

// PolarGrid is exported directly above, not as a dynamic import

// PolarAngleAxis is exported directly above, not as a dynamic import

// PolarRadiusAxis is exported directly above, not as a dynamic import

// Export types (these don't need dynamic imports)
// Note: Not all prop types are exported by recharts, commenting out to avoid build errors
// export type {
//   ResponsiveContainerProps,
//   LineChartProps,
//   BarChartProps,
//   AreaChartProps,
//   PieChartProps,
//   RadarChartProps,
//   RadialBarChartProps,
//   ComposedChartProps,
//   ScatterChartProps,
//   XAxisProps,
//   YAxisProps,
//   ZAxisProps,
//   CartesianGridProps,
//   TooltipProps,
//   LegendProps,
//   CellProps,
//   LabelListProps,
//   ReferenceLineProps,
//   ReferenceAreaProps,
//   ReferenceDotProps,
//   BrushProps,
//   PolarGridProps,
//   PolarAngleAxisProps,
//   PolarRadiusAxisProps,
// } from 'recharts';

// For components that need immediate access to certain exports
export const getRechartsSync = () => import('recharts');