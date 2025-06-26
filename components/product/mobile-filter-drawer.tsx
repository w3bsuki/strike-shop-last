'use client';

import React from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  activeFiltersCount: number;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  children,
  activeFiltersCount,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:hidden" style={{ zIndex: 'var(--z-modal)' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 text-sm font-normal">
                  ({activeFiltersCount})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="h-11 w-11 flex items-center justify-center -mr-3 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-subtle">
          <Button
            onClick={onClose}
            className="button-primary w-full"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}