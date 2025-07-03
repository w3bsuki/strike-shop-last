'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NetworkContextType {
  isOnline: boolean;
  isReconnecting: boolean;
  retryConnection: () => void;
  queueAction: (action: () => Promise<void>) => void;
  executeQueuedActions: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [queuedActions, setQueuedActions] = useState<(() => Promise<void>)[]>([]);
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);

  // Check online status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setHasShownOfflineToast(false);
        
        toast({
          title: 'Back online',
          description: 'Connection restored. Syncing data...',
        });
        
        // Execute queued actions when back online
        executeQueuedActions();
      };

      const handleOffline = () => {
        setIsOnline(false);
        
        if (!hasShownOfflineToast) {
          toast({
            title: 'You\'re offline',
            description: 'Some features may be limited. Changes will sync when connection is restored.',
            variant: 'destructive',
          });
          setHasShownOfflineToast(true);
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return () => {};
  }, [hasShownOfflineToast]);

  // Periodically check connection
  useEffect(() => {
    const checkConnection = async () => {
      if (!isOnline) {
        try {
          // Try to fetch a small resource to check connectivity
          const response = await fetch('/api/health', {
            method: 'HEAD',
            cache: 'no-cache',
          });
          
          if (response.ok && !isOnline) {
            setIsOnline(true);
            setHasShownOfflineToast(false);
          }
        } catch {
          // Still offline
        }
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isOnline]);

  const retryConnection = useCallback(async () => {
    setIsReconnecting(true);
    
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        setIsOnline(true);
        setHasShownOfflineToast(false);
        
        toast({
          title: 'Connection restored',
          description: 'You\'re back online!',
        });
        
        await executeQueuedActions();
      }
    } catch (error) {
      toast({
        title: 'Still offline',
        description: 'Could not establish connection. Please check your internet.',
        variant: 'destructive',
      });
    } finally {
      setIsReconnecting(false);
    }
  }, []);

  const queueAction = useCallback((action: () => Promise<void>) => {
    setQueuedActions(prev => [...prev, action]);
  }, []);

  const executeQueuedActions = useCallback(async () => {
    if (queuedActions.length === 0) return;

    try {
      for (const action of queuedActions) {
        await action();
      }
      
      setQueuedActions([]);
      
      toast({
        title: 'Sync complete',
        description: 'All pending changes have been saved.',
      });
    } catch (error) {
      console.error('Failed to execute queued actions:', error);
      
      toast({
        title: 'Sync failed',
        description: 'Some changes could not be saved. Please try again.',
        variant: 'destructive',
      });
    }
  }, [queuedActions]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isReconnecting,
        retryConnection,
        queueAction,
        executeQueuedActions,
      }}
    >
      {children}
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-gray-900 text-white rounded-lg p-3 flex items-center gap-2 shadow-lg">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">You're offline</span>
            {queuedActions.length > 0 && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                {queuedActions.length} pending
              </span>
            )}
            <button
              onClick={retryConnection}
              disabled={isReconnecting}
              className="ml-2 text-xs bg-blue-500 hover:bg-info disabled:bg-gray-600 px-2 py-1 rounded"
            >
              {isReconnecting ? 'Checking...' : 'Retry'}
            </button>
          </div>
        </div>
      )}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// Hook for network-aware operations
export function useNetworkAwareOperation() {
  const { isOnline, queueAction } = useNetwork();

  const executeOrQueue = useCallback(
    async (operation: () => Promise<void>, fallback?: () => void) => {
      if (isOnline) {
        try {
          await operation();
        } catch (error) {
          // If operation fails and might be network-related, queue it
          if (error instanceof Error && 
              (error.message.includes('fetch') || 
               error.message.includes('network') ||
               error.message.includes('connection'))) {
            queueAction(operation);
            fallback?.();
          } else {
            throw error;
          }
        }
      } else {
        queueAction(operation);
        fallback?.();
        
        toast({
          title: 'Queued for later',
          description: 'Action will be executed when connection is restored.',
        });
      }
    },
    [isOnline, queueAction]
  );

  return {
    isOnline,
    executeOrQueue,
  };
}