'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if install was previously dismissed
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return // Don't show for 7 days after dismissal
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay to not be intrusive
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000) // 30 seconds
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  if (!showPrompt || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-2 shadow-lg">
        <CardContent className="relative p-4">
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 p-1 rounded-md hover:bg-secondary transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="pr-8">
            <h3 className="font-semibold text-base mb-1">Install Strike Shop</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Add to your home screen for a faster, app-like experience with offline support.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              Install App
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="outline" className="flex-1">
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}