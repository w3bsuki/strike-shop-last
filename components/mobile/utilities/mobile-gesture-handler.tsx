'use client';

import { ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface GestureEvent {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface MobileGestureHandlerProps {
  children: ReactNode;
  onSwipe?: (event: GestureEvent) => void;
  onPinch?: (scale: number) => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  className?: string;
  threshold?: number;
  longPressDelay?: number;
}

export function MobileGestureHandler({
  children,
  onSwipe,
  onPinch,
  onLongPress,
  onDoubleTap,
  className,
  threshold = 50,
  longPressDelay = 500,
}: MobileGestureHandlerProps) {
  const touchStartTime = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistance = useRef<number>(0);
  const [isPinching, setIsPinching] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const getDirection = (deltaX: number, deltaY: number): GestureEvent['direction'] => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY && absX > threshold) {
      return deltaX > 0 ? 'right' : 'left';
    } else if (absY > absX && absY > threshold) {
      return deltaY > 0 ? 'down' : 'up';
    }
    return null;
  };

  const getPinchDistance = (touches: React.TouchList): number => {
    const [touch1, touch2] = Array.from(touches);
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartTime.current = Date.now();
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;

    // Handle double tap
    const currentTime = Date.now();
    if (onDoubleTap && currentTime - lastTapTime.current < 300) {
      onDoubleTap();
      triggerHaptic('success');
      lastTapTime.current = 0; // Reset to prevent triple tap
    } else {
      lastTapTime.current = currentTime;
    }

    // Handle long press
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        triggerHaptic('medium');
      }, longPressDelay);
    }

    // Handle pinch start
    if (e.touches.length === 2 && onPinch) {
      setIsPinching(true);
      initialPinchDistance.current = getPinchDistance(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pinch
    if (isPinching && e.touches.length === 2 && onPinch) {
      const currentDistance = getPinchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance.current;
      onPinch(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Cancel long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Reset pinch
    if (isPinching) {
      setIsPinching(false);
      initialPinchDistance.current = 0;
    }

    // Handle swipe
    if (onSwipe && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;

      const velocityX = deltaX / deltaTime;
      const velocityY = deltaY / deltaTime;
      const direction = getDirection(deltaX, deltaY);

      if (direction) {
        onSwipe({
          deltaX,
          deltaY,
          velocityX,
          velocityY,
          direction,
        });
        triggerHaptic('light');
      }
    }
  };

  return (
    <div
      className={cn('touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  );
}