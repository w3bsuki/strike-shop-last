'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth-provider'
import { Button } from '@/components/ui/button-unified'
import { Input, FormField } from '@/components/ui/input-unified'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [acceptsMarketing, setAcceptsMarketing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required')
      return false
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Sign up with Supabase
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        accepts_marketing: acceptsMarketing,
      })

      // Create Shopify customer
      try {
        const shopifyResponse = await fetch('/api/auth/shopify/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            acceptsMarketing,
          }),
        });
        
        if (!shopifyResponse.ok) {
          console.log('Shopify customer creation failed, but Supabase account created');
        } else {
          const { customerId } = await shopifyResponse.json();
          console.log('Shopify customer created:', customerId);
        }
      } catch (shopifyError) {
        // Shopify sync is optional during sign-up
        console.error('Shopify customer creation error:', shopifyError);
      }

      setIsSuccess(true)
      
      // Redirect to confirmation page
      setTimeout(() => {
        router.push('/confirm?email=' + encodeURIComponent(email))
      }, 2000)
    } catch (err: any) {
      console.error('Sign up error:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto" />
          <h2 className="text-2xl font-bold">Account Created Successfully!</h2>
          <p className="text-muted-foreground">
            Please check your email to confirm your account.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to confirmation page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-typewriter font-bold text-foreground uppercase">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link href="/sign-in" className="font-medium text-foreground hover:underline">
              sign in to existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name">
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>
              
              <FormField label="Last Name">
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>
            </div>

            <FormField label="Email Address" required>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                error={error?.includes('email') ? error : false}
              />
            </FormField>
            
            <FormField label="Password" required>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                helperText="Minimum 8 characters"
              />
            </FormField>

            {password && (
              <PasswordStrengthMeter password={password} />
            )}
            
            <FormField label="Confirm Password" required>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                error={password !== confirmPassword && confirmPassword ? 'Passwords do not match' : false}
              />
            </FormField>

            <div className="flex items-center">
              <input
                id="accepts-marketing"
                type="checkbox"
                checked={acceptsMarketing}
                onChange={(e) => setAcceptsMarketing(e.target.checked)}
                className="h-4 w-4 text-foreground focus:ring-primary border-border rounded"
                disabled={isLoading}
              />
              <label htmlFor="accepts-marketing" className="ml-2 block text-sm text-foreground">
                Send me exclusive offers and updates
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              loadingText="Creating account..."
            >
              Create Account
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-muted text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => signUp(email, password, { provider: 'google' })}
                disabled={isLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => signUp(email, password, { provider: 'github' })}
                disabled={isLoading}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}