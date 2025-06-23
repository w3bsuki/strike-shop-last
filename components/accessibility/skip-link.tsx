import React from 'react';

/**
 * Skip Link for keyboard navigation
 * Allows users to skip repetitive navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:rounded-md text-sm font-medium"
    >
      Skip to main content
    </a>
  );
}
