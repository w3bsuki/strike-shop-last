'use client';

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Metrics {
  lcp?: number;
  fcp?: number;
  ttfb?: number;
  cls?: number;
}

export function PerformanceReport() {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const checkPerformance = async () => {
      try {
        if (performanceMonitor && typeof performanceMonitor.getWebVitals === 'function') {
          const webVitals = await performanceMonitor.getWebVitals();
          if (webVitals) {
            setMetrics(webVitals);
          }
        }
      } catch (error) {

      }
    };

    // Wait for page load
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        checkPerformance();
      } else {
        window.addEventListener('load', checkPerformance);
        return () => window.removeEventListener('load', checkPerformance);
      }
    }
  }, []);

  useEffect(() => {
    // Toggle with keyboard shortcut (Ctrl/Cmd + Shift + P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible || process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[500] max-w-sm">
      <Card className="bg-black/90 text-white backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center justify-between">
            Performance Metrics
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs hover:text-gray-300"
            >
              ✕
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-xs">
          <MetricRow
            label="LCP"
            value={metrics.lcp}
            target={2500}
            format={(v) => `${v.toFixed(0)}ms`}
          />
          <MetricRow
            label="FCP"
            value={metrics.fcp}
            target={1800}
            format={(v) => `${v.toFixed(0)}ms`}
          />
          <MetricRow
            label="TTFB"
            value={metrics.ttfb}
            target={800}
            format={(v) => `${v.toFixed(0)}ms`}
          />

          <div className="pt-2 border-t border-white/20 text-[10px] text-gray-400">
            Press Ctrl+Shift+P to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({
  label,
  value,
  target,
  format,
}: {
  label: string;
  value?: number;
  target: number;
  format: (value: number) => string;
}) {
  if (value === undefined) return null;

  const isGood = value <= target;
  const percentage = Math.min((value / target) * 100, 200);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-gray-400">{label}:</span>
        <span className={isGood ? 'text-green-400' : 'text-red-400'}>
          {format(value)}
        </span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isGood ? 'bg-green-400' : 'bg-red-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
