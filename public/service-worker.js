// Service Worker for Strike Shop
const CACHE_NAME = 'strike-shop-v1';
const STATIC_CACHE = 'strike-shop-static-v1';
const DYNAMIC_CACHE = 'strike-shop-dynamic-v1';
const IMAGE_CACHE = 'strike-shop-images-v1';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/_next/static/css/app.css',
  '/fonts/CourierPrime-Regular.ttf',
  '/fonts/CourierPrime-Bold.ttf',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching critical resources');
      return cache.addAll(CRITICAL_RESOURCES.filter(resource => {
        // Only cache existing resources
        return fetch(resource, { method: 'HEAD' })
          .then(() => true)
          .catch(() => false);
      }));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('strike-shop-') && 
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== IMAGE_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) protocols
  if (!request.url.startsWith('http')) return;

  // Handle different resource types with appropriate strategies
  
  // Images - Cache First strategy
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) return response;
          
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS) - Cache First with fallback
  if (url.pathname.startsWith('/_next/static/') || 
      /\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // API calls - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // HTML pages - Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) return response;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default - Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync for cart data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartData());
  }
});

async function syncCartData() {
  // Sync cart data when back online
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  const cartRequests = requests.filter(req => 
    req.url.includes('/api/cart')
  );
  
  for (const request of cartRequests) {
    try {
      await fetch(request);
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});