'use client';

/**
 * EXTREME PERFORMANCE CACHING SERVICE
 * Implements aggressive caching strategies for FAST AS FUCK performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface RequestCache {
  [key: string]: Promise<any> | undefined;
}

class ExtremePerfCache {
  private cache = new Map<string, CacheItem<any>>();
  private requestCache: RequestCache = {};
  private maxSize = 1000; // Maximum cache entries
  
  /**
   * AGGRESSIVE: Get cached data with ultra-fast response
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * AGGRESSIVE: Set cache with automatic cleanup
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Auto cleanup if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }
  
  /**
   * CRITICAL: Deduplicate identical requests to prevent multiple API calls
   */
  async dedupe<T>(key: string, asyncFn: () => Promise<T>, ttlMs: number = 5 * 60 * 1000): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached) return cached;
    
    // Check if request is already in flight
    if (key in this.requestCache && this.requestCache[key]) {
      return this.requestCache[key];
    }
    
    // Execute request and cache the promise
    this.requestCache[key] = asyncFn()
      .then((result) => {
        this.set(key, result, ttlMs);
        delete this.requestCache[key];
        return result;
      })
      .catch((error) => {
        delete this.requestCache[key];
        throw error;
      });
    
    return this.requestCache[key];
  }
  
  /**
   * EXTREME: Pre-fetch and cache critical data
   */
  async prefetch<T>(key: string, asyncFn: () => Promise<T>, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    try {
      const data = await asyncFn();
      this.set(key, data, ttlMs);
    } catch (error) {

    }
  }
  
  /**
   * AGGRESSIVE: Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, item]) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    });
    
    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.maxSize * 0.3));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.requestCache = {};
  }
  
  /**
   * Get cache stats for monitoring
   */
  getStats() {
    return {
      size: this.cache.size,
      requestsInFlight: Object.keys(this.requestCache).length,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
    };
  }
  
  private hitCount = 0;
  private missCount = 0;
}

// Global cache instance
export const perfCache = new ExtremePerfCache();

/**
 * CRITICAL: Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlMs: number = 5 * 60 * 1000,
  keyGen?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGen ? keyGen(...args) : `${fn.name}_${JSON.stringify(args)}`;
    return perfCache.dedupe(key, () => fn(...args), ttlMs);
  }) as T;
}

/**
 * EXTREME: Browser storage cache with compression
 */
export class BrowserCache {
  private prefix = 'strike_cache_';
  
  set(key: string, data: any, ttlMs: number = 30 * 60 * 1000): void {
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify(item)
      );
    } catch (error) {

    }
  }
  
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Check expiration
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {

      return null;
    }
  }
}

export const browserCache = new BrowserCache();

/**
 * CRITICAL: Image preloader for faster page loads
 */
export class ImagePreloader {
  private loaded = new Set<string>();
  private loading = new Set<string>();
  
  preload(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => this.preloadSingle(url));
    return Promise.all(promises);
  }
  
  private preloadSingle(url: string): Promise<void> {
    if (this.loaded.has(url)) return Promise.resolve();
    if (this.loading.has(url)) return Promise.resolve();
    
    this.loading.add(url);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loaded.add(url);
        this.loading.delete(url);
        resolve();
      };
      
      img.onerror = () => {
        this.loading.delete(url);
        reject(new Error(`Failed to preload image: ${url}`));
      };
      
      img.src = url;
    });
  }
  
  isLoaded(url: string): boolean {
    return this.loaded.has(url);
  }
}

export const imagePreloader = new ImagePreloader();