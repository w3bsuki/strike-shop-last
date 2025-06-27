'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CacheManager } from '@/lib/pwa/cache-manager'
import { Loader2, Trash2, Download, Bell, Wifi, WifiOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PWASettings() {
  const [cacheStats, setCacheStats] = useState<any[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [storageEstimate, setStorageEstimate] = useState({ usage: 0, quota: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isPersistent, setIsPersistent] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCacheStats()
    checkPersistentStorage()
    checkNotificationPermission()
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadCacheStats = async () => {
    setIsLoading(true)
    try {
      const stats = await CacheManager.getCacheStats()
      setCacheStats(stats)
      
      const total = await CacheManager.getTotalCacheSize()
      setTotalSize(total)
      
      const estimate = await CacheManager.getStorageEstimate()
      setStorageEstimate(estimate)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPersistentStorage = async () => {
    if (navigator.storage && navigator.storage.persisted) {
      const persisted = await navigator.storage.persisted()
      setIsPersistent(persisted)
    }
  }

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached data? This may affect offline functionality.')) {
      setIsLoading(true)
      try {
        await CacheManager.clearAllCaches()
        await loadCacheStats()
        toast({
          title: 'Cache cleared',
          description: 'All cached data has been removed.',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to clear cache.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRequestPersistent = async () => {
    try {
      const granted = await CacheManager.requestPersistentStorage()
      setIsPersistent(granted)
      toast({
        title: granted ? 'Storage persisted' : 'Storage not persisted',
        description: granted 
          ? 'Your data will be preserved.' 
          : 'Browser denied persistent storage.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request persistent storage.',
        variant: 'destructive',
      })
    }
  }

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will receive updates about your orders.',
        })
      } else {
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        })
      }
    } else {
      setNotificationsEnabled(false)
    }
  }

  const handlePrecacheEssentials = async () => {
    setIsLoading(true)
    try {
      const essentialUrls = [
        '/',
        '/products',
        '/categories',
        '/cart',
        '/account',
      ]
      await CacheManager.precacheUrls(essentialUrls)
      await loadCacheStats()
      toast({
        title: 'Essential pages cached',
        description: 'Key pages are now available offline.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cache essential pages.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const storagePercentage = storageEstimate.quota > 0 
    ? (storageEstimate.usage / storageEstimate.quota) * 100 
    : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Offline & Storage Settings</CardTitle>
          <CardDescription>
            Manage your offline data and storage preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Label>Connection Status</Label>
            </div>
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>
                {CacheManager.formatBytes(storageEstimate.usage)} / {CacheManager.formatBytes(storageEstimate.quota)}
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {storagePercentage.toFixed(1)}% of available storage used
            </p>
          </div>

          {/* Cache Statistics */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Cache Statistics</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : cacheStats.length > 0 ? (
              <div className="space-y-2">
                {cacheStats.map((stat) => (
                  <div key={stat.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stat.name.replace('strike-shop-', '')}
                    </span>
                    <span>
                      {stat.count} items ({CacheManager.formatBytes(stat.size)})
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{CacheManager.formatBytes(totalSize)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No cached data found</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handlePrecacheEssentials}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Cache Essential Pages
            </Button>
            
            <Button
              onClick={handleClearCache}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
          </div>

          {/* Settings */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="persistent">Persistent Storage</Label>
                <p className="text-xs text-muted-foreground">
                  Prevent browser from clearing your data
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isPersistent ? (
                  <span className="text-xs text-green-600">Enabled</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestPersistent}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get updates about orders and deals
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}