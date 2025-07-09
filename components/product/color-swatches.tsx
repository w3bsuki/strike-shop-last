'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ColorSwatchesProps {
  colors: string[];
  selectedColor?: string;
  onColorSelect?: (color: string) => void;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ColorSwatches({
  colors,
  selectedColor,
  onColorSelect,
  maxDisplay = 4,
  size = 'md',
  className
}: ColorSwatchesProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const displayColors = colors.slice(0, maxDisplay);
  const remainingCount = colors.length - maxDisplay;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {displayColors.map((color, index) => (
        <button
          key={index}
          onClick={() => onColorSelect?.(color)}
          onMouseEnter={() => setHoveredColor(color)}
          onMouseLeave={() => setHoveredColor(null)}
          className={cn(
            "rounded-full border-2 transition-all duration-200 flex-shrink-0",
            sizeClasses[size],
            selectedColor === color 
              ? "border-gray-900 scale-110" 
              : "border-gray-300 hover:border-gray-400",
            hoveredColor === color && "scale-105"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select ${color} color`}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 ml-1 font-medium">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}