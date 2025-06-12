import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="block">
            <h1 className="text-3xl font-bold tracking-wider text-black">STRIKE™</h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        
        <div className="bg-white p-8 shadow rounded-lg">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-black hover:bg-gray-800 text-sm',
                card: 'shadow-none',
                headerTitle: 'sr-only',
                headerSubtitle: 'sr-only',
              }
            }}
          />
        </div>
        
        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}