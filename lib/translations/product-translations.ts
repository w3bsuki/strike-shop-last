// Temporary product translations until Shopify Markets are configured
// This provides immediate localization while Shopify setup is pending

import type { Locale } from '@/lib/i18n/config';

export interface ProductTranslation {
  name: string;
  description: string;
}

export interface CollectionTranslation {
  name: string;
  description: string;
}

// Product translations by Shopify ID
export const productTranslations: Record<string, Record<Locale, ProductTranslation>> = {
  // Actual Shopify product IDs
  'gid://shopify/Product/15038545166713': {
    en: {
      name: 'T-Shirt',
      description: 'Premium cotton t-shirt featuring contemporary streetwear design. Comfortable fit with modern style.'
    },
    bg: {
      name: 'Тениска',
      description: 'Висококачествена памучна тениска с модерен стрийт уеър дизайн. Удобен крой с модерен стил.'
    },
    ua: {
      name: 'Футболка',
      description: "Преміальна бавовняна футболка з сучасним стрітвер дизайном. Зручний крій з модним стилем."
    }
  },
  'gid://shopify/Product/15038545559929': {
    en: {
      name: 'Denim Shorts',
      description: 'High-quality denim shorts with modern cut. Perfect for casual wear and summer style.'
    },
    bg: {
      name: 'Дънкови Панталонки',
      description: 'Висококачествени дънкови панталонки с модерен крой. Перфектни за ежедневно носене и лятна мода.'
    },
    ua: {
      name: 'Джинсові Шорти',
      description: 'Високоякісні джинсові шорти з сучасним кроєм. Ідеальні для повсякденного носіння та літнього стилю.'
    }
  },
  'gid://shopify/Product/15038546084217': {
    en: {
      name: 'Sneakers',
      description: 'Contemporary sneakers combining comfort and style. Ideal for everyday wear and active lifestyle.'
    },
    bg: {
      name: 'Маратонки',
      description: 'Съвременни маратонки съчетаващи комфорт и стил. Идеални за ежедневно носене и активен начин на живот.'
    },
    ua: {
      name: 'Кросівки',
      description: 'Сучасні кросівки, що поєднують комфорт і стиль. Ідеальні для щоденного носіння та активного способу життя.'
    }
  }
};

// Collection translations by Shopify ID
export const collectionTranslations: Record<string, Record<Locale, CollectionTranslation>> = {
  // Actual Shopify collection IDs
  'gid://shopify/Collection/672365937017': {
    en: {
      name: 'T-SHIRTS',
      description: 'Premium t-shirt collection'
    },
    bg: {
      name: 'ТЕНИСКИ',
      description: 'Премиум колекция тениски'
    },
    ua: {
      name: 'ФУТБОЛКИ',
      description: 'Преміум колекція футболок'
    }
  },
  'gid://shopify/Collection/672365969785': {
    en: {
      name: 'DENIM',
      description: 'Contemporary denim collection'
    },
    bg: {
      name: 'ДЪНКИ',
      description: 'Съвременна дънкова колекция'
    },
    ua: {
      name: 'ДЖИНСИ',
      description: 'Сучасна джинсова колекція'
    }
  },
  'gid://shopify/Collection/672366002553': {
    en: {
      name: 'FOOTWEAR',
      description: 'Premium footwear collection'
    },
    bg: {
      name: 'ОБУВКИ',
      description: 'Премиум колекция обувки'
    },
    ua: {
      name: 'ВЗУТТЯ',
      description: 'Преміум колекція взуття'
    }
  },
  'gid://shopify/Collection/672366035321': {
    en: {
      name: 'JACKETS',
      description: 'Stylish jacket collection'
    },
    bg: {
      name: 'ЯКЕТА',
      description: 'Стилна колекция якета'
    },
    ua: {
      name: 'КУРТКИ',
      description: 'Стильна колекція курток'
    }
  },
  'gid://shopify/Collection/672366068089': {
    en: {
      name: 'ACCESSORIES',
      description: 'Essential accessories collection'
    },
    bg: {
      name: 'АКСЕСОАРИ',
      description: 'Колекция от основни аксесоари'
    },
    ua: {
      name: 'АКСЕСУАРИ',
      description: 'Колекція основних аксесуарів'
    }
  }
};

// Generic category translations for common terms
export const categoryTranslations: Record<string, Record<Locale, string>> = {
  'sneakers': {
    en: 'Sneakers',
    bg: 'Маратонки',
    ua: 'Кросівки'
  },
  'footwear': {
    en: 'Footwear',
    bg: 'Обувки',
    ua: 'Взуття'
  },
  'apparel': {
    en: 'Apparel',
    bg: 'Дрехи',
    ua: 'Одяг'
  },
  'clothing': {
    en: 'Clothing',
    bg: 'Облекло',
    ua: 'Одяг'
  },
  't-shirt': {
    en: 'T-Shirt',
    bg: 'Тениска',
    ua: 'Футболка'
  },
  'jeans': {
    en: 'Jeans',
    bg: 'Дънки',
    ua: "Джинси"
  },
  'jacket': {
    en: 'Jacket',
    bg: 'Яке',
    ua: 'Куртка'
  },
  'accessories': {
    en: 'Accessories',
    bg: 'Аксесоари',
    ua: 'Аксесуари'
  }
};

// Function to get translated product name
export function getTranslatedProductName(
  productId: string, 
  originalName: string, 
  locale: Locale
): string {
  // Try exact product translation first
  const productTranslation = productTranslations[productId]?.[locale];
  if (productTranslation) {
    return productTranslation.name;
  }

  // Try category-based translation
  const lowerName = originalName.toLowerCase();
  for (const [key, translations] of Object.entries(categoryTranslations)) {
    if (lowerName.includes(key)) {
      return translations[locale] || originalName;
    }
  }

  // Return original if no translation found
  return originalName;
}

// Function to get translated product description
export function getTranslatedProductDescription(
  productId: string, 
  originalDescription: string, 
  locale: Locale
): string {
  // Try exact product translation first
  const productTranslation = productTranslations[productId]?.[locale];
  if (productTranslation) {
    return productTranslation.description;
  }

  // Return original if no translation found
  return originalDescription;
}

// Function to get translated collection name
export function getTranslatedCollectionName(
  collectionId: string, 
  originalName: string, 
  locale: Locale
): string {
  // Try exact collection translation first
  const collectionTranslation = collectionTranslations[collectionId]?.[locale];
  if (collectionTranslation) {
    return collectionTranslation.name;
  }

  // Try category-based translation
  const lowerName = originalName.toLowerCase();
  for (const [key, translations] of Object.entries(categoryTranslations)) {
    if (lowerName.includes(key)) {
      return translations[locale]?.toUpperCase() || originalName;
    }
  }

  // Return original if no translation found
  return originalName;
}