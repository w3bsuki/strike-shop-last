'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// Product type for quick view
export interface QuickViewProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  images?: string[];
  slug: string;
  isNew?: boolean;
  soldOut?: boolean;
  colors?: number;
  description?: string;
  sizes?: string[];
  sku?: string;
  variants?: Array<{
    id: string;
    title: string;
    sku?: string;
    prices?: any[];
  }>;
}

interface QuickViewContextValue {
  // State
  isOpen: boolean;
  currentProduct: QuickViewProduct | null;

  // Actions
  openQuickView: (product: QuickViewProduct) => void;
  closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextValue | undefined>(
  undefined
);

interface QuickViewProviderProps {
  children: ReactNode;
}

export function QuickViewProvider({ children }: QuickViewProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<QuickViewProduct | null>(
    null
  );

  const openQuickView = useCallback((product: QuickViewProduct) => {
    if (!product) {
      console.error('No product data provided to openQuickView');
      return;
    }

    // Enhance product with default data where missing
    const enhancedProduct: QuickViewProduct = {
      ...product,
      images: product.images || [
        product.image,
        product.image.replace('300', '301'),
        product.image.replace('300', '302'),
      ],
      description:
        product.description ||
        `Premium ${product.name.toLowerCase()} crafted with attention to detail and modern design aesthetics. Features high-quality materials and contemporary styling.`,
      sizes: product.sizes || ['XS', 'S', 'M', 'L', 'XL'],
      sku:
        product.sku ||
        `STR${product.id
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 8)}${Math.floor(Math.random() * 1000)}`,
    };

    setCurrentProduct(enhancedProduct);
    setIsOpen(true);
  }, []);

  const closeQuickView = useCallback(() => {
    setIsOpen(false);
    // Delay clearing the product to allow dialog animation to complete
    setTimeout(() => {
      setCurrentProduct(null);
    }, 300);
  }, []);

  const value: QuickViewContextValue = {
    isOpen,
    currentProduct,
    openQuickView,
    closeQuickView,
  };

  return (
    <QuickViewContext.Provider value={value}>
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const context = useContext(QuickViewContext);
  if (context === undefined) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
}
