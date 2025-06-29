'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register in production
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              // Service Worker registered successfully

              // Check for updates periodically
              setInterval(() => {
                registration.update();
              }, 60000); // Check every minute

              // Handle updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (
                      newWorker.state === 'installed' &&
                      navigator.serviceWorker.controller
                    ) {
                      // New content available, could show update prompt

                    }
                  });
                }
              });
            })
            .catch((_error) => {

            });
        });
      }
    }
  }, []);

  return null;
}
