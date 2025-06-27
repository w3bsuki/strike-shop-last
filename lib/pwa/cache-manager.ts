/**
 * Cache Manager for Strike Shop PWA
 * Provides utilities for managing service worker caches
 */

export interface CacheStats {
  name: string
  count: number
  size: number
}

export class CacheManager {
  private static readonly CACHE_PREFIX = 'strike-shop'
  
  /**
   * Get all cache statistics
   */
  static async getCacheStats(): Promise<CacheStats[]> {
    if (!('caches' in window)) return []
    
    const cacheNames = await caches.keys()
    const stats: CacheStats[] = []
    
    for (const name of cacheNames) {
      if (name.includes(this.CACHE_PREFIX)) {
        const cache = await caches.open(name)
        const requests = await cache.keys()
        
        let totalSize = 0
        for (const request of requests) {
          const response = await cache.match(request)
          if (response && response.headers.get('content-length')) {
            totalSize += parseInt(response.headers.get('content-length') || '0')
          }
        }
        
        stats.push({
          name,
          count: requests.length,
          size: totalSize
        })
      }
    }
    
    return stats
  }
  
  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) return
    
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter(name => name.includes(this.CACHE_PREFIX))
        .map(name => caches.delete(name))
    )
    
    // Tell service worker to skip waiting and claim clients
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
    }
  }
  
  /**
   * Clear specific cache
   */
  static async clearCache(cacheName: string): Promise<void> {
    if (!('caches' in window)) return
    await caches.delete(cacheName)
  }
  
  /**
   * Precache URLs
   */
  static async precacheUrls(urls: string[]): Promise<void> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return
    
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls
    })
  }
  
  /**
   * Get total cache size
   */
  static async getTotalCacheSize(): Promise<number> {
    const stats = await this.getCacheStats()
    return stats.reduce((total, stat) => total + stat.size, 0)
  }
  
  /**
   * Format bytes to human readable
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  /**
   * Check if running in standalone mode (installed PWA)
   */
  static isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://')
  }
  
  /**
   * Check if PWA is installable
   */
  static async isInstallable(): Promise<boolean> {
    // Check basic PWA requirements
    const hasServiceWorker = 'serviceWorker' in navigator
    const isSecureContext = window.isSecureContext
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null
    
    return hasServiceWorker && isSecureContext && hasManifest && !this.isStandalone()
  }
  
  /**
   * Request persistent storage
   */
  static async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist()
      return isPersisted
    }
    return false
  }
  
  /**
   * Get storage estimate
   */
  static async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { usage: 0, quota: 0 }
  }
  
  /**
   * Enable offline analytics
   */
  static enableOfflineAnalytics(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ENABLE_OFFLINE_ANALYTICS'
      })
    }
  }
}