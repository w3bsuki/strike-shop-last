'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { accessibilityConfig } from '@/lib/accessibility-config';

interface LiveRegionProps {
  message?: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // milliseconds
  className?: string;
  id?: string;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Enhanced Live Region Component for WCAG AA compliance
 * Announces dynamic content changes to screen readers
 */
export function LiveRegion({
  message = '',
  politeness = 'polite',
  clearAfter = 5000,
  className = 'sr-only',
  id,
  relevant = 'all',
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (message) {
      // Force re-render to ensure announcement
      setKey(prev => prev + 1);
      setAnnouncement(message);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setAnnouncement('');
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
    
    // Return empty cleanup function when no timer is set
    return () => {};
  }, [message, clearAfter]);

  return (
    <div
      key={key}
      id={id}
      role={politeness === 'off' ? undefined : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      aria-relevant={relevant}
      className={className}
      style={{ 
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {announcement}
    </div>
  );
}

// Context for global live region management
interface LiveRegionContextType {
  announce: (text: string, politeness?: 'polite' | 'assertive') => void;
  announceError: (text: string) => void;
  announceSuccess: (text: string) => void;
  clear: () => void;
}

const LiveRegionContext = createContext<LiveRegionContextType | null>(null);

/**
 * Enhanced hook for managing live region announcements
 */
export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  if (context) return context;

  // Fallback for when used outside provider
  const [messages, setMessages] = useState<{ polite: string; assertive: string }>({
    polite: '',
    assertive: '',
  });

  const announce = (
    text: string,
    politeness: 'polite' | 'assertive' = 'polite'
  ) => {
    // Clear existing message first to ensure re-announcement
    setMessages(prev => ({ ...prev, [politeness]: '' }));

    // Use setTimeout to ensure state update
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [politeness]: text }));
    }, accessibilityConfig.screenReader.announceDelay);

    // Auto-clear after delay
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [politeness]: '' }));
    }, 5000);
  };

  const announceError = (text: string) => {
    announce(`Error: ${text}`, 'assertive');
  };

  const announceSuccess = (text: string) => {
    announce(`Success: ${text}`, 'polite');
  };

  const clear = () => {
    setMessages({ polite: '', assertive: '' });
  };

  return {
    messages,
    announce,
    announceError,
    announceSuccess,
    clear,
  };
}

/**
 * Enhanced Global Live Region Provider
 * Place at app root to handle announcements throughout the app
 */
export function LiveRegionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const announce = (text: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const setter = politeness === 'polite' ? setPoliteMessage : setAssertiveMessage;
    
    // Clear first to ensure re-announcement
    setter('');
    
    setTimeout(() => {
      setter(text);
    }, accessibilityConfig.screenReader.announceDelay);

    // Auto-clear after 5 seconds
    setTimeout(() => {
      setter('');
    }, 5000);
  };

  const announceError = (text: string) => {
    announce(`Error: ${text}`, 'assertive');
  };

  const announceSuccess = (text: string) => {
    announce(`Success: ${text}`, 'polite');
  };

  const clear = () => {
    setPoliteMessage('');
    setAssertiveMessage('');
    setLoadingMessage('');
  };

  const contextValue: LiveRegionContextType = {
    announce,
    announceError,
    announceSuccess,
    clear,
  };

  return (
    <LiveRegionContext.Provider value={contextValue}>
      {children}
      
      {/* Polite announcements for general updates */}
      <LiveRegion 
        message={politeMessage} 
        politeness="polite" 
        id="polite-announcer"
        clearAfter={0} // Managed by provider
      />
      
      {/* Assertive announcements for important updates */}
      <LiveRegion 
        message={assertiveMessage} 
        politeness="assertive" 
        id="assertive-announcer"
        clearAfter={0} // Managed by provider
      />
      
      {/* Loading state announcements */}
      <LiveRegion
        message={loadingMessage}
        politeness="polite"
        id="loading-announcer"
        relevant="all"
        clearAfter={0} // Managed by provider
      />
    </LiveRegionContext.Provider>
  );
}

/**
 * Specialized live regions for common use cases
 */
export function CartUpdateAnnouncer({ itemCount }: { itemCount: number }) {
  const prevCount = React.useRef(itemCount);
  const { announce } = useLiveRegion();

  useEffect(() => {
    if (prevCount.current !== itemCount) {
      const diff = itemCount - prevCount.current;
      if (diff > 0) {
        announce(`${diff} item${diff > 1 ? 's' : ''} added to cart. Total: ${itemCount} item${itemCount !== 1 ? 's' : ''}.`);
      } else if (diff < 0) {
        announce(`${Math.abs(diff)} item${Math.abs(diff) > 1 ? 's' : ''} removed from cart. Total: ${itemCount} item${itemCount !== 1 ? 's' : ''}.`);
      }
      prevCount.current = itemCount;
    }
  }, [itemCount, announce]);

  return null;
}

export function FormErrorAnnouncer({ errors }: { errors: string[] }) {
  const { announceError } = useLiveRegion();

  useEffect(() => {
    if (errors.length > 0 && errors[0]) {
      const errorMessage = errors.length === 1 
        ? errors[0]
        : `There are ${errors.length} errors in the form. ${errors[0]}`;
      announceError(errorMessage);
    }
  }, [errors, announceError]);

  return null;
}
