'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerProvider() {
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Skip service worker registration in development or when using Turbopack
      if (process.env.NODE_ENV === 'development') {
        console.log('Service Worker registration skipped in development mode')
        return
      }

      // Register service worker
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          console.log('Service Worker registered:', registration)

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                toast({
                  title: 'Update Available',
                  description: 'A new version is available. Click to update.',
                  action: (
                    <button
                      onClick={() => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                        window.location.reload()
                      }}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm"
                    >
                      Update
                    </button>
                  ),
                })
              }
            })
          })

          // Handle controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
          })

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Every hour

          // Background sync registration
          if ('sync' in registration) {
            // Register background sync for cart
            navigator.serviceWorker.ready.then((reg) => {
              return reg.sync.register('sync-cart')
            }).catch((error) => {
              console.error('Background sync registration failed:', error)
            })
          }

          // Periodic background sync (if supported)
          if ('periodicSync' in registration && 'permissions' in navigator) {
            (async () => {
              try {
                const status = await navigator.permissions.query({
                  name: 'periodic-background-sync' as PermissionName,
                })
                
                if (status.state === 'granted') {
                  const tags = await registration.periodicSync.getTags()
                  if (!tags.includes('price-update')) {
                    await registration.periodicSync.register('price-update', {
                      minInterval: 24 * 60 * 60 * 1000, // 24 hours
                    })
                  }
                }
              } catch (error) {
                console.error('Periodic sync setup failed:', error)
              }
            })()
          }

        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      })

      // Handle app install prompt
      let deferredPrompt: any
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e

        // Show install button or banner
        toast({
          title: 'Install Strike Shop',
          description: 'Add Strike Shop to your home screen for a better experience.',
          action: (
            <button
              onClick={async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt()
                  const { outcome } = await deferredPrompt.userChoice
                  console.log(`User response to install prompt: ${outcome}`)
                  deferredPrompt = null
                }
              }}
              className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm"
            >
              Install
            </button>
          ),
        })
      })

      // Handle successful installation
      window.addEventListener('appinstalled', () => {
        console.log('Strike Shop was installed.')
        toast({
          title: 'App Installed',
          description: 'Strike Shop has been added to your home screen.',
        })
      })

      // Handle online/offline status
      const updateOnlineStatus = () => {
        if (!navigator.onLine) {
          toast({
            title: 'You are offline',
            description: 'Some features may be limited.',
            variant: 'destructive',
          })
        }
      }

      window.addEventListener('online', () => {
        toast({
          title: 'Back online',
          description: 'Connection restored.',
        })
      })

      window.addEventListener('offline', updateOnlineStatus)

      // Request notification permission for push notifications
      if ('Notification' in window && Notification.permission === 'default') {
        // We'll ask for permission when user performs an action that benefits from notifications
        // For now, just log the status
        console.log('Notification permission:', Notification.permission)
      }
    }
  }, [toast])

  return null
}