const CACHE_NAME = 'strike-shop-v1';
const STATIC_CACHE_NAME = 'strike-shop-static-v1';
const DYNAMIC_CACHE_NAME = 'strike-shop-dynamic-v1';

// Critical assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/fonts/CourierPrime-Regular.ttf',
  '/fonts/CourierPrime-Bold.ttf',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      // Filter out assets that exist
      return Promise.allSettled(
        STATIC_ASSETS.map(asset => cache.add(asset).catch(err => {
          console.warn(`[Service Worker] Failed to cache ${asset}:`, err);
        }))
      );
    })
  );
  
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('strike-shop-') && 
                   cacheName !== STATIC_CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip requests to API endpoints - always go to network
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('hot-update')) {
    return;
  }
  
  event.respondWith(
    // Try network first
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();
        
        // Cache successful responses (200 OK)
        if (response.status === 200) {
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((response) => {
          if (response) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return response;
          }
          
          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/offline.html').catch(() => {
              // If offline.html is not cached, return a basic offline response
              return new Response(
                `<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - Strike Shop</title>
                  <style>
                    body {
                      font-family: 'Courier New', monospace;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      background: #000;
                      color: #fff;
                      text-align: center;
                      padding: 20px;
                    }
                    h1 {
                      font-size: 2em;
                      margin-bottom: 0.5em;
                    }
                    p {
                      opacity: 0.8;
                    }
                  </style>
                </head>
                <body>
                  <div>
                    <h1>YOU'RE OFFLINE</h1>
                    <p>Please check your connection and try again.</p>
                  </div>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' },
                  status: 200
                }
              );
            });
          }
          
          // Return a 404 for other failed requests
          return new Response('Not found', { status: 404 });
        });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting');
    self.skipWaiting();
  }
});

// Background sync for cart
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    console.log('[Service Worker] Syncing cart...');
    event.waitUntil(
      // Sync cart data with server when back online
      fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Cart data would be retrieved from IndexedDB
          timestamp: new Date().toISOString()
        })
      }).catch((error) => {
        console.error('[Service Worker] Cart sync failed:', error);
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Strike Shop',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Go to site' },
      { action: 'close', title: 'Close' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Strike Shop', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});