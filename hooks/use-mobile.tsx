"use client"

import { useState, useEffect } from "react"

export function useMobile(query = "(max-width: 768px)") {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleResize = () => setIsMobile(mediaQuery.matches)

    handleResize() // Set initial state
    mediaQuery.addEventListener("change", handleResize)

    return () => mediaQuery.removeEventListener("change", handleResize)
  }, [query])

  return isMobile
}
