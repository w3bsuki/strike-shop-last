"use client"

import React, { useState, useEffect } from "react"

interface LiveRegionProps {
  message?: string
  politeness?: 'polite' | 'assertive'
  clearAfter?: number // milliseconds
  className?: string
  id?: string
}

/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 */
export function LiveRegion({ 
  message = "", 
  politeness = 'polite',
  clearAfter = 5000,
  className = "sr-only",
  id
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message)

  useEffect(() => {
    if (message) {
      setAnnouncement(message)

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setAnnouncement("")
        }, clearAfter)

        return () => clearTimeout(timer)
      }
    }
  }, [message, clearAfter])

  return (
    <div
      id={id}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={className}
    >
      {announcement}
    </div>
  )
}

/**
 * Hook for managing live region announcements
 */
export function useLiveRegion() {
  const [message, setMessage] = useState("")

  const announce = (text: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Clear existing message first to ensure re-announcement
    setMessage("")
    
    // Use setTimeout to ensure state update
    setTimeout(() => {
      setMessage(text)
    }, 100)
  }

  const clear = () => {
    setMessage("")
  }

  return {
    message,
    announce,
    clear,
  }
}

/**
 * Global Live Region Provider
 * Place at app root to handle announcements throughout the app
 */
export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LiveRegion politeness="polite" id="polite-announcer" />
      <LiveRegion politeness="assertive" id="assertive-announcer" />
    </>
  )
}