import { useState, useCallback, useEffect, useRef } from 'react';
import { retry, handleError, type LoadingState } from '@/lib/error-handling';

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  showErrorToast?: boolean;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const [state, setState] = useState<LoadingState<T>>({
    isLoading: false,
    error: null,
    data: null,
    retry: () => {},
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]) => {
      // Cancel any previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const executeFunction = async () => {
          // Pass abort signal if the function accepts it
          const result = await asyncFunction(...args, {
            signal: abortControllerRef.current?.signal,
          });
          
          if (!mountedRef.current) return;
          
          setState({
            isLoading: false,
            error: null,
            data: result,
            retry: () => execute(...args),
          });
          
          options.onSuccess?.(result);
          return result;
        };

        if (options.retry) {
          return await retry(executeFunction, {
            maxAttempts: options.retryCount || 3,
            delay: options.retryDelay || 1000,
            onRetry: (attempt, error) => {
              if (mountedRef.current) {
                console.warn(`Retry attempt ${attempt}:`, error.message);
              }
            },
          });
        } else {
          return await executeFunction();
        }
      } catch (error) {
        if (!mountedRef.current) return;
        
        const err = error as Error;
        
        // Ignore abort errors
        if (err.name === 'AbortError') return;
        
        setState({
          isLoading: false,
          error: err,
          data: null,
          retry: () => execute(...args),
        });
        
        handleError(err, options.showErrorToast !== false);
        options.onError?.(err);
        
        throw err;
      }
    },
    [asyncFunction, options]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      isLoading: false,
      error: null,
      data: null,
      retry: () => {},
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for lazy loading with automatic execution
export function useLazyAsync<T = any>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = {}
) {
  const { execute, ...state } = useAsync(asyncFunction, options);

  useEffect(() => {
    execute();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// Hook for debounced async operations
export function useDebouncedAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  delay: number,
  options: UseAsyncOptions = {}
) {
  const [debouncedState, setDebouncedState] = useState<LoadingState<T>>({
    isLoading: false,
    error: null,
    data: null,
    retry: () => {},
  });
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { execute: executeAsync } = useAsync(asyncFunction, options);

  const execute = useCallback(
    (...args: any[]) => {
      clearTimeout(timeoutRef.current);
      setDebouncedState(prev => ({ ...prev, isLoading: true }));
      
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await executeAsync(...args);
          setDebouncedState({
            isLoading: false,
            error: null,
            data: result ?? null,
            retry: () => execute(...args),
          });
        } catch (error) {
          setDebouncedState(prev => ({
            ...prev,
            isLoading: false,
            error: error as Error,
          }));
        }
      }, delay);
    },
    [executeAsync, delay]
  );

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    ...debouncedState,
    execute,
  };
}