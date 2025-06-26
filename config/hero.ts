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
  sm: "h-[40vh] md:h-[50vh]",
  default: "h-[65vh] md:h-[70vh]",
  lg: "h-[80vh] md:h-[85vh]",
  full: "h-screen",
} as const;

export const heroOverlayClasses = {
  none: "",
  gradient: "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
  stark: "bg-black/20",
  subtle: "bg-black/10",
} as const;