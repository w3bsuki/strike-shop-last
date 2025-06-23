import { 
  Shirt, 
  Package,
  Footprints,
  Watch,
  ShoppingBag,
  Zap,
  Heart,
  Users,
  type LucideIcon
} from 'lucide-react';

// Custom SVG icons for specific clothing items
export const PantsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 2h8v7l-4 9-4-9V2z" />
    <path d="M8 9l-2 11h4l2-9m4 0l2 11h-4l-2-9" />
  </svg>
);

export const HoodieIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C8 2 5 5 5 8v10a2 2 0 002 2h10a2 2 0 002-2V8c0-3-3-6-7-6z" />
    <path d="M12 2v6" />
    <path d="M7 8c0-2.5 2-4.5 5-4.5s5 2 5 4.5" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
  </svg>
);

export const JacketIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 2l-4 4-4-4L4 8v12a2 2 0 002 2h12a2 2 0 002-2V8l-4-6z" />
    <path d="M12 6v16" />
    <path d="M8 10h8" />
  </svg>
);

export const AccessoriesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4m0 12v4m10-10h-4m-12 0H2" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

export const ShortsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 6h8v5l-4 5-4-5V6z" />
    <path d="M8 11l-2 5h4l2-5m4 0l2 5h-4l-2-5" />
  </svg>
);

// Category icon mapping
export const categoryIcons: Record<string, LucideIcon | React.FC<{ className?: string }>> = {
  // Clothing
  'shirts': Shirt,
  'shirt': Shirt,
  't-shirts': Shirt,
  'tshirts': Shirt,
  'tees': Shirt,
  'tops': Shirt,
  
  'pants': PantsIcon,
  'trousers': PantsIcon,
  'jeans': PantsIcon,
  'bottoms': PantsIcon,
  
  'hoodies': HoodieIcon,
  'sweatshirts': HoodieIcon,
  'sweaters': HoodieIcon,
  'knitwear': HoodieIcon,
  
  'jackets': JacketIcon,
  'coats': JacketIcon,
  'outerwear': JacketIcon,
  
  'shorts': ShortsIcon,
  'swimwear': ShortsIcon,
  
  // Footwear
  'shoes': Footprints,
  'sneakers': Footprints,
  'footwear': Footprints,
  'boots': Footprints,
  
  // Accessories
  'accessories': AccessoriesIcon,
  'watches': Watch,
  'bags': ShoppingBag,
  'backpacks': ShoppingBag,
  
  // Collections
  'new': Zap,
  'new-arrivals': Zap,
  'sale': Heart,
  'trending': Zap,
  'best-sellers': Heart,
  
  // Gender/Size
  'men': Users,
  'women': Users,
  'kids': Users,
  'unisex': Users,
  
  // Default
  'all': Package,
  'default': Package,
};

export function getCategoryIcon(categoryName: string): LucideIcon | React.FC<{ className?: string }> {
  const normalizedName = categoryName.toLowerCase().replace(/['"]/g, '');
  
  // Check exact match first
  if (categoryIcons[normalizedName]) {
    return categoryIcons[normalizedName];
  }
  
  // Check if category contains any key
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }
  
  // Return default icon
  return Package;
}