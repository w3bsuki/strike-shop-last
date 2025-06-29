'use client';

import { useState, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface MobilePullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function MobilePullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
}: MobilePullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const { triggerHaptic } = useHapticFeedback();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    if (window.scrollY === 0) {
      touchStartY.current = touch.clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current || disabled || isRefreshing) return;

    const touch = e.touches[0];
    if (!touch) return;
    const distance = touch.clientY - touchStartY.current;

    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      
      // Apply resistance
      const resistance = 2.5;
      const adjustedDistance = Math.min(distance / resistance, threshold * 1.5);
      
      setPullDistance(adjustedDistance);
      
      // Check if threshold reached
      if (adjustedDistance >= threshold && !canRefresh) {
        setCanRefresh(true);
        triggerHaptic('medium');
      } else if (adjustedDistance < threshold && canRefresh) {
        setCanRefresh(false);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!touchStartY.current || disabled || isRefreshing) return;

    if (canRefresh) {
      setIsRefreshing(true);
      triggerHaptic('success');
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
        triggerHaptic('error');
      } finally {
        setIsRefreshing(false);
      }
    }

    // Reset
    setPullDistance(0);
    setCanRefresh(false);
    touchStartY.current = null;
  };

  const indicatorTransform = `translateY(${Math.min(pullDistance - 40, 40)}px)`;
  const contentTransform = `translateY(${pullDistance}px)`;
  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorScale = canRefresh ? 1.2 : 1;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10"
        style={{
          transform: indicatorTransform,
          opacity: indicatorOpacity,
          transition: isRefreshing ? 'all 0.3s ease' : 'none',
        }}
      >
        <div
          className={cn(
            'bg-white rounded-full p-2 shadow-lg',
            isRefreshing && 'animate-spin'
          )}
          style={{
            transform: `scale(${indicatorScale})`,
            transition: 'transform 0.2s ease',
          }}
        >
          <RefreshCw
            className={cn(
              'h-5 w-5',
              canRefresh ? 'text-black' : 'text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: contentTransform,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}