'use client';

import React from 'react';
import { 
  ShirtIcon, 
  Package, 
  Footprints, 
  Watch, 
  Gem, 
  ShoppingBag,
  Sparkles,
  Zap,
  Heart,
  Star,
  LucideIcon
} from 'lucide-react';

// Map category names to icons
const categoryIcons: Record<string, LucideIcon> = {
  'clothing': ShirtIcon,
  'shirts': ShirtIcon,
  'shoes': Footprints,
  'accessories': Watch,
  'jewelry': Gem,
  'bags': ShoppingBag,
  'new': Sparkles,
  'sale': Zap,
  'favorites': Heart,
  'trending': Star,
  'default': Package,
};

interface CategoryIconProps {
  categoryName: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ 
  categoryName, 
  className = '', 
  size = 24 
}: CategoryIconProps) {
  const normalizedName = categoryName.toLowerCase().replace(/[^a-z]/g, '');
  const Icon = categoryIcons[normalizedName] || categoryIcons.default;
  
  return (
    <Icon 
      className={className} 
      size={size}
      aria-hidden="true"
    />
  );
}

// Category icon with background for use in cards
export function CategoryIconBadge({ 
  categoryName, 
  variant = 'default' 
}: { 
  categoryName: string;
  variant?: 'default' | 'large' | 'small';
}) {
  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const iconSizes = {
    small: 16,
    default: 20,
    large: 24
  };

  return (
    <div className={`${sizeClasses[variant]} bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200`}>
      <CategoryIcon 
        categoryName={categoryName} 
        size={iconSizes[variant]}
        className="text-gray-700"
      />
    </div>
  );
}