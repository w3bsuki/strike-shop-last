/**
 * EXTREME PERFORMANCE SERVICE WORKER - FAST AS FUCK caching
 * Implements aggressive caching strategies for sub-second load times
 */

const CACHE_VERSION = 'strike-shop-v2-extreme'
const API_CACHE = `${CACHE_VERSION}-api`
const STATIC_CACHE = `${CACHE_VERSION}-static`
const IMAGE_CACHE = `${CACHE_VERSION}-images`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

// AGGRESSIVE cache configuration for maximum performance
const CACHE_CONFIG = {
  api: {
    maxAge: 2 * 60 * 1000, // 2 minutes - more aggressive
    maxEntries: 100, // Increased capacity
  },
  static: {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 200, // Increased capacity
  },
  images: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 300, // Much larger image cache
  },
  runtime: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50,
  },
}

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/products/,
  /\/api\/categories/,
  /\/api\/search/,
  /\/store\/products/,
  /\/store\/collections/,
]

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('[SW] Failed to precache:', error)
      })
    })
  )
  
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('strike-shop-') && !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      )
    })
  )
  
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle image requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
    return
  }
  
  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request))
    return
  }
  
  // Default - network first, cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    })
  )
})

// Handle API requests with stale-while-revalidate
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Return cached response immediately if available
  if (cachedResponse) {
    const age = getResponseAge(cachedResponse)
    
    // If cache is fresh, return it
    if (age < CACHE_CONFIG.api.maxAge) {
      // Revalidate in background
      fetchAndCache(request, cache).catch(() => {})
      return cachedResponse
    }
  }
  
  // Fetch fresh data
  try {
    const response = await fetchAndCache(request, cache)
    return response
  } catch (error) {
    // Return stale cache if available
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Handle image requests with cache-first
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return placeholder image if available
    return caches.match('/images/placeholder.png')
  }
}

// Handle static assets with cache-first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    throw error
  }
}

// Helper functions
function isApiRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isImageRequest(request) {
  const acceptHeader = request.headers.get('Accept')
  return acceptHeader && acceptHeader.includes('image')
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|woff2?|ttf|otf)$/)
}

async function fetchAndCache(request, cache) {
  const response = await fetch(request)
  
  if (response.ok) {
    // Add timestamp header for cache age calculation
    const responseWithTimestamp = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    })
    responseWithTimestamp.headers.set('sw-cached-at', new Date().toISOString())
    
    cache.put(request, responseWithTimestamp.clone())
    return responseWithTimestamp
  }
  
  return response
}

function getResponseAge(response) {
  const cachedAt = response.headers.get('sw-cached-at')
  if (!cachedAt) return Infinity
  
  return Date.now() - new Date(cachedAt).getTime()
}

// Cache management
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxEntries) {
    // Delete oldest entries
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map(key => cache.delete(key))
    )
  }
}

// Periodic cache cleanup
setInterval(() => {
  trimCache(API_CACHE, CACHE_CONFIG.api.maxEntries)
  trimCache(IMAGE_CACHE, CACHE_CONFIG.images.maxEntries)
  trimCache(STATIC_CACHE, CACHE_CONFIG.static.maxEntries)
}, 60 * 1000) // Every minute

// Message handling for cache control
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        )
      })
    )
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(API_CACHE).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})