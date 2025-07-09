'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface QuickViewContextType {
  isOpen: boolean;
  productId: string | null;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  const openQuickView = (id: string) => {
    setProductId(id);
    setIsOpen(true);
  };

  const closeQuickView = () => {
    setIsOpen(false);
    setProductId(null);
  };

  return (
    <QuickViewContext.Provider value={{ isOpen, productId, openQuickView, closeQuickView }}>
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