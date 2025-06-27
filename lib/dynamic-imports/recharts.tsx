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

// Dynamic imports for Recharts components
export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer })),
  { loading: () => <ChartLoading />,  }
);

export const LineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { loading: () => <ChartLoading />,  }
);

export const Line = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Line })),
  {  }
);

export const BarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart })),
  { loading: () => <ChartLoading />,  }
);

export const Bar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Bar })),
  {  }
);

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart })),
  { loading: () => <ChartLoading />,  }
);

export const Area = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Area })),
  {  }
);

export const PieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart })),
  { loading: () => <ChartLoading />,  }
);

export const Pie = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Pie })),
  {  }
);

export const RadarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadarChart })),
  { loading: () => <ChartLoading />,  }
);

export const Radar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Radar })),
  {  }
);

export const RadialBarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadialBarChart })),
  { loading: () => <ChartLoading />,  }
);

export const RadialBar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadialBar })),
  {  }
);

export const ComposedChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ComposedChart })),
  { loading: () => <ChartLoading />,  }
);

export const ScatterChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ScatterChart })),
  { loading: () => <ChartLoading />,  }
);

export const Scatter = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Scatter })),
  {  }
);

export const XAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.XAxis })),
  {  }
);

export const YAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.YAxis })),
  {  }
);

export const ZAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ZAxis })),
  {  }
);

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.CartesianGrid })),
  {  }
);

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Tooltip })),
  {  }
);

export const Legend = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Legend })),
  {  }
);

export const Cell = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Cell })),
  {  }
);

export const LabelList = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LabelList })),
  {  }
);

export const ReferenceLine = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ReferenceLine })),
  {  }
);

export const ReferenceArea = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ReferenceArea })),
  {  }
);

export const ReferenceDot = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ReferenceDot })),
  {  }
);

export const Brush = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Brush })),
  {  }
);

export const PolarGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarGrid })),
  {  }
);

export const PolarAngleAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarAngleAxis })),
  {  }
);

export const PolarRadiusAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarRadiusAxis })),
  {  }
);

// Export types (these don't need dynamic imports)
export type {
  ResponsiveContainerProps,
  LineChartProps,
  BarChartProps,
  AreaChartProps,
  PieChartProps,
  RadarChartProps,
  RadialBarChartProps,
  ComposedChartProps,
  ScatterChartProps,
  XAxisProps,
  YAxisProps,
  ZAxisProps,
  CartesianGridProps,
  TooltipProps,
  LegendProps,
  CellProps,
  LabelListProps,
  ReferenceLineProps,
  ReferenceAreaProps,
  ReferenceDotProps,
  BrushProps,
  PolarGridProps,
  PolarAngleAxisProps,
  PolarRadiusAxisProps,
} from 'recharts';

// For components that need immediate access to certain exports
export const getRechartsSync = () => import('recharts');