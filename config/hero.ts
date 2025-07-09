export type HeroVariant = "default" | "centered" | "split" | "minimal";
export type HeroSize = "sm" | "default" | "lg" | "full";
export type HeroOverlay = "none" | "gradient" | "stark" | "subtle";

export interface HeroConfig {
  title: string;
  subtitle?: string;
  image: string;
  cta?: {
    text: string;
    href: string;
    variant?: "default" | "outline" | "ghost";
  };
  badge?: string;
  variant?: HeroVariant;
  size?: HeroSize;
  overlay?: HeroOverlay;
}

export const heroPresets = {
  home: {
    title: "STRIKE SS25",
    subtitle: "DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1920&h=1080&fit=crop&q=80",
    cta: {
      text: "EXPLORE COLLECTION",
      href: "/new",
    },
    variant: "centered" as HeroVariant,
    size: "lg" as HeroSize,
    overlay: "stark" as HeroOverlay,
  },
  sale: {
    title: "END OF SEASON SALE",
    subtitle: "UP TO 70% OFF SELECTED ITEMS",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1080&fit=crop&q=80",
    cta: {
      text: "SHOP SALE",
      href: "/sale",
    },
    badge: "LIMITED TIME",
    variant: "default" as HeroVariant,
    size: "default" as HeroSize,
    overlay: "gradient" as HeroOverlay,
  },
  category: {
    title: "MENSWEAR",
    subtitle: "CONTEMPORARY LUXURY",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1920&h=1080&fit=crop&q=80",
    variant: "minimal" as HeroVariant,
    size: "sm" as HeroSize,
    overlay: "subtle" as HeroOverlay,
  },
} as const;

export const heroSizeClasses = {
  sm: "h-[60vh] md:h-[70vh] lg:h-[80vh] min-h-[400px] md:min-h-[500px] lg:min-h-[600px]",
  default: "h-[70vh] md:h-[80vh] lg:h-[85vh] min-h-[500px] md:min-h-[600px] lg:min-h-[700px]",
  lg: "h-[80vh] md:h-[85vh] lg:h-[90vh] min-h-[600px] md:min-h-[700px] lg:min-h-[800px]",
  full: "h-screen min-h-[600px]",
} as const;

export const heroOverlayClasses = {
  none: "",
  gradient: "bg-gradient-to-t from-gray-900/90 via-gray-800/50 to-gray-700/20",
  stark: "bg-gray-800/60",
  subtle: "bg-gray-900/30",
} as const;