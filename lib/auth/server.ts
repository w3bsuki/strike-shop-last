// Data Access Layer Authentication - CVE-2025-29927 Compliant
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Server-side authentication utilities for Data Access Layer
 * CVE-2025-29927 Compliant: NO middleware authentication
 */

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

/**
 * Get current user session - USE ONLY in Server Components/Route Handlers
 * Never call this from middleware
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Require authentication for protected routes
 * Use in Server Components or Route Handlers ONLY
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    const signInUrl = redirectTo 
      ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
      : '/sign-in'
    redirect(signInUrl)
  }
  
  return user
}

/**
 * Check if user is authenticated (returns boolean)
 * Use for conditional rendering in Server Components
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Get user or redirect to sign-in
 * Use in layout.tsx or page.tsx for protected routes
 */
export async function getAuthenticatedUser(currentPath?: string): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    const redirectUrl = currentPath 
      ? `/sign-in?redirectTo=${encodeURIComponent(currentPath)}`
      : '/sign-in'
    redirect(redirectUrl)
  }
  
  return user
}

/**
 * Redirect authenticated users away from auth pages
 * Use in sign-in/sign-up pages
 */
export async function redirectIfAuthenticated(redirectTo: string = '/account') {
  const user = await getCurrentUser()
  
  if (user) {
    redirect(redirectTo)
  }
}