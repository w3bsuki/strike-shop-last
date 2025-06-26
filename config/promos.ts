export interface PromoConfig {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  discount?: {
    value: number;
    unit?: string;
    suffix?: string;
  };
  link?: string;
  endDate?: string | Date;
  theme?: 'default' | 'inverted' | 'gradient' | 'custom';
  size?: 'sm' | 'default' | 'lg';
  layout?: 'default' | 'centered' | 'split' | 'stacked';
  background?: {
    pattern?: 'stripes' | 'dots' | 'grid' | 'custom';
    image?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  priority?: number;
  enabled?: boolean;
}

export const promoConfigs: PromoConfig[] = [
  {
    id: 'winter-sale-2025',
    title: 'WINTER SALE',
    subtitle: 'UP TO 70% OFF SELECTED ITEMS',
    discount: {
      value: 70,
      unit: '%',
      suffix: 'OFF EVERYTHING',
    },
    link: '/sale',
    endDate: 'January 31, 2025',
    theme: 'default',
    size: 'default',
    layout: 'default',
    background: {
      pattern: 'stripes',
    },
    priority: 1,
    enabled: true,
  },
  {
    id: 'new-collection-ss25',
    title: 'SS25 COLLECTION',
    subtitle: 'DISCOVER THE LATEST TRENDS',
    description: 'Exclusive early access for members',
    link: '/new',
    theme: 'gradient',
    size: 'lg',
    layout: 'centered',
    background: {
      gradientFrom: '#000000',
      gradientTo: '#1a1a1a',
    },
    priority: 2,
    enabled: true,
  },
  {
    id: 'free-shipping',
    title: 'FREE WORLDWIDE SHIPPING',
    subtitle: 'ON ORDERS OVER €150',
    link: '/shipping',
    theme: 'inverted',
    size: 'sm',
    layout: 'centered',
    priority: 3,
    enabled: true,
  },
  {
    id: 'members-exclusive',
    title: 'MEMBERS EXCLUSIVE',
    subtitle: 'JOIN NOW FOR 20% OFF',
    discount: {
      value: 20,
      unit: '%',
      suffix: 'FIRST ORDER',
    },
    link: '/membership',
    theme: 'default',
    size: 'default',
    layout: 'default',
    background: {
      pattern: 'dots',
    },
    priority: 4,
    enabled: false, // Can be toggled on/off
  },
];

// Helper functions
export function getActivePromos(): PromoConfig[] {
  return promoConfigs
    .filter(promo => promo.enabled)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export function getPromoById(id: string): PromoConfig | undefined {
  return promoConfigs.find(promo => promo.id === id);
}

export function getPromosByTheme(theme: PromoConfig['theme']): PromoConfig[] {
  return promoConfigs.filter(promo => promo.theme === theme && promo.enabled);
}

export function hasActiveDiscount(promo: PromoConfig): boolean {
  if (!promo.discount || !promo.endDate) return false;
  
  const endDate = new Date(promo.endDate);
  return endDate > new Date();
}