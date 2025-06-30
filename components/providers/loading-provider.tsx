'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAll: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        loadingStates,
        setLoading,
        isLoading,
        isAnyLoading,
        clearAll,
      }}
    >
      {children}
      {/* Global loading indicator */}
      {isAnyLoading() && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white shadow-lg rounded-lg p-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Hook for managing loading state of a specific operation
export function useOperationLoading(key: string) {
  const { setLoading, isLoading } = useLoading();

  const startLoading = useCallback(() => {
    setLoading(key, true);
  }, [key, setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);

  const withLoading = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await operation();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading: isLoading(key),
    startLoading,
    stopLoading,
    withLoading,
  };
}