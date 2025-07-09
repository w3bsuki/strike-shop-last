"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function useSignOut() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signOut = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        throw signOutError
      }
      
      router.push('/')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      setError(message)
      console.error('Sign out error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signOut,
    isLoading,
    error
  }
}