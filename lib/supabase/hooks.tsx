'use client'

import React from 'react'
import { useAuth } from './auth-provider'
import { useRouter } from 'next/navigation'

// Clerk-compatible hooks for easy migration
export const useUser = () => {
  const { user, isLoading } = useAuth()
  
  return {
    isSignedIn: !!user,
    user: user ? {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      firstName: user.user_metadata?.full_name?.split(' ')[0],
      lastName: user.user_metadata?.full_name?.split(' ')[1],
      imageUrl: user.user_metadata?.avatar_url,
      emailAddresses: [{ emailAddress: user.email }],
      phoneNumbers: user.user_metadata?.phone ? [{ phoneNumber: user.user_metadata.phone }] : [],
    } : null,
    isLoaded: !isLoading,
  }
}

export const useSession = () => {
  const { session, isLoading } = useAuth()
  
  return {
    session,
    isLoaded: !isLoading,
    isSignedIn: !!session,
  }
}

export const useClerk = () => {
  const { signOut } = useAuth()
  const router = useRouter()
  
  return {
    signOut,
    openUserProfile: () => router.push('/account/profile'),
    openSignIn: () => router.push('/sign-in'),
    openSignUp: () => router.push('/sign-up'),
  }
}

// Auth UI components that match Clerk's API
export const SignInButton = ({ children, mode = 'modal', asChild = false, ...props }: any) => {
  const router = useRouter()
  
  // If asChild is true, clone the child element and add the onClick handler
  if (asChild && children) {
    return React.cloneElement(children, {
      onClick: () => router.push('/sign-in'),
      ...props
    })
  }
  
  return (
    <button onClick={() => router.push('/sign-in')} {...props}>
      {children}
    </button>
  )
}

export const UserButton = ({ afterSignOutUrl = '/', ...props }: any) => {
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  
  if (!user) return null
  
  return (
    <button
      onClick={async () => {
        await signOut()
        router.push(afterSignOutUrl)
      }}
      className="h-8 w-8 rounded-full bg-gray-200"
      {...props}
    >
      {user.firstName?.[0] || user.email?.[0] || 'U'}
    </button>
  )
}

export const SignedIn = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser()
  return isSignedIn ? <>{children}</> : null
}

export const SignedOut = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser()
  return !isSignedIn ? <>{children}</> : null
}