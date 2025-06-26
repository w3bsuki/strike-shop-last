// Product display configuration

export const productConfig = {
  // Default product card sizes for different layouts
  cardSizes: {
    scroll: {
      default: "w-44 sm:w-48 md:w-52 lg:w-60",
      sm: "w-36 sm:w-40 md:w-44 lg:w-48",
      lg: "w-52 sm:w-56 md:w-60 lg:w-72",
    },
    grid: {
      default: "w-full",
    },
  },

  // Product section configurations
  sections: {
    newArrivals: {
      title: "NEW ARRIVALS",
      viewAllLink: "/new",
      layout: "scroll" as const,
      showBadge: true,
      badgeText: "NEW",
      badgeVariant: "new" as const,
    },
    sale: {
      title: "SS25 MENS SALE",
      viewAllLink: "/sale/men",
      layout: "scroll" as const,
      showBadge: true,
      badgeText: "SALE",
      badgeVariant: "sale" as const,
    },
    footwear: {
      title: "FEATURED FOOTWEAR",
      viewAllLink: "/footwear",
      layout: "scroll" as const,
    },
    kids: {
      title: "KIDS COLLECTION",
      viewAllLink: "/kids",
      layout: "scroll" as const,
    },
  },

  // Badge configurations
  badges: {
    sale: {
      text: "SALE",
      variant: "sale" as const,
      position: "topLeft" as const,
    },
    new: {
      text: "NEW",
      variant: "new" as const,
      position: "topLeft" as const,
    },
    soldOut: {
      text: "SOLD OUT",
      variant: "soldOut" as const,
      position: "topRight" as const,
    },
    limited: {
      text: "LIMITED",
      variant: "limited" as const,
      position: "topLeft" as const,
    },
  },

  // Price display settings
  priceDisplay: {
    showCurrency: true,
    currency: "€",
    showOriginalPrice: true,
  },

  // Quick view settings
  quickView: {
    enabled: true,
    showOnHover: true,
  },

  // Wishlist settings
  wishlist: {
    enabled: true,
    showOnCard: true,
  },

  // Performance settings
  performance: {
    lazyLoadThreshold: 50, // px before viewport
    scrollDebounce: 150, // ms
    imageOptimization: {
      quality: 80,
      formats: ["webp", "avif"],
    },
  },
} as const;

export type ProductConfig = typeof productConfig;