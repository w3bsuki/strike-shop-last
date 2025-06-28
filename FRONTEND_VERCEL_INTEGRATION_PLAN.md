# 🎨 Frontend (Vercel) Integration Architecture Plan

## Executive Summary
Production-ready integration plan for Next.js frontend deployment on Vercel, connecting to Medusa API, Stripe payments, and optimized for global e-commerce performance.

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Next.js    │  │  Edge        │  │   Middleware     │ │
│  │   App Router │  │  Functions   │  │  (Auth/Geo)      │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│  Medusa API  │    │    Stripe    │   │   CDN/Cache  │
│   (Render)   │    │   Elements   │   │  (Vercel)    │
└──────────────┘    └──────────────┘   └──────────────┘
```

## 📋 Complete Integration Steps

### Step 1: Project Setup & Configuration

#### 1.1 Next.js App Configuration
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better error detection
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: [
      'strikeshop-assets.s3.amazonaws.com',  // S3 bucket
      'stripe.com',                           // Stripe assets
      'cdn.medusajs.com',                    // Medusa CDN
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/store',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
```

#### 1.2 TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/styles/*": ["./src/styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 2: Medusa API Integration

#### 2.1 API Client Configuration
```typescript
// src/lib/medusa/client.ts
import { MedusaClient } from '@medusajs/js-sdk'

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'

export const medusa = new MedusaClient({
  baseUrl: MEDUSA_BACKEND_URL,
  auth: {
    type: 'session',
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
})

// Type-safe API client with error handling
export class MedusaAPI {
  static async request<T>(
    operation: () => Promise<T>,
    options?: {
      retries?: number
      retryDelay?: number
    }
  ): Promise<T> {
    const { retries = 3, retryDelay = 1000 } = options || {}
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation()
      } catch (error) {
        if (i === retries - 1) throw error
        
        console.error(`API request failed, retry ${i + 1}/${retries}:`, error)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
      }
    }
    
    throw new Error('Max retries reached')
  }
}
```

#### 2.2 React Query Configuration
```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// src/app/providers.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
```

#### 2.3 API Hooks
```typescript
// src/hooks/use-products.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { medusa } from '@/lib/medusa/client'

export function useProducts(params?: {
  limit?: number
  offset?: number
  category_id?: string
  collection_id?: string
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await medusa.products.list(params)
      return response.products
    },
  })
}

export function useInfiniteProducts(params?: {
  limit?: number
  category_id?: string
}) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await medusa.products.list({
        ...params,
        offset: pageParam,
        limit: params?.limit || 20,
      })
      return response
    },
    getNextPageParam: (lastPage, pages) => {
      const totalLoaded = pages.reduce((acc, page) => acc + page.products.length, 0)
      return totalLoaded < lastPage.count ? totalLoaded : undefined
    },
    initialPageParam: 0,
  })
}

// src/hooks/use-cart.ts
export function useCart() {
  const cartId = useCartStore(state => state.cartId)
  
  return useQuery({
    queryKey: ['cart', cartId],
    queryFn: async () => {
      if (!cartId) return null
      const response = await medusa.carts.retrieve(cartId)
      return response.cart
    },
    enabled: !!cartId,
  })
}
```

### Step 3: State Management

#### 3.1 Zustand Store Setup
```typescript
// src/store/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { medusa } from '@/lib/medusa/client'

interface CartStore {
  cartId: string | null
  isLoading: boolean
  error: string | null
  
  createCart: () => Promise<void>
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartId: null,
      isLoading: false,
      error: null,
      
      createCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await medusa.carts.create()
          set({ cartId: response.cart.id })
        } catch (error) {
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },
      
      addItem: async (variantId: string, quantity: number) => {
        const { cartId } = get()
        if (!cartId) await get().createCart()
        
        set({ isLoading: true, error: null })
        try {
          await medusa.carts.lineItems.create(get().cartId!, {
            variant_id: variantId,
            quantity,
          })
        } catch (error) {
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },
      
      // ... other methods
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cartId: state.cartId }),
    }
  )
)
```

### Step 4: Edge Middleware

#### 4.1 Geolocation & Currency
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { geolocation } from '@vercel/edge'

export function middleware(request: NextRequest) {
  const { country, region, city } = geolocation(request)
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Add geo data to headers
  requestHeaders.set('x-geo-country', country || 'US')
  requestHeaders.set('x-geo-region', region || 'unknown')
  requestHeaders.set('x-geo-city', city || 'unknown')
  
  // Currency mapping
  const currencyMap: Record<string, string> = {
    US: 'usd',
    GB: 'gbp',
    DE: 'eur',
    FR: 'eur',
    JP: 'jpy',
    // Add more mappings
  }
  
  const currency = currencyMap[country || 'US'] || 'usd'
  requestHeaders.set('x-currency', currency)
  
  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Set currency cookie if not exists
  if (!request.cookies.get('currency')) {
    response.cookies.set('currency', currency, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Step 5: Performance Optimization

#### 5.1 Image Optimization
```typescript
// src/components/product-image.tsx
import Image from 'next/image'
import { useState } from 'react'

export function ProductImage({ 
  src, 
  alt, 
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: {
  src: string
  alt: string
  priority?: boolean
  sizes?: string
}) {
  const [isLoading, setLoading] = useState(true)
  
  return (
    <div className="relative aspect-square overflow-hidden bg-gray-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`
          object-cover duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}
```

#### 5.2 Bundle Optimization
```typescript
// src/lib/dynamic-imports.ts
import dynamic from 'next/dynamic'

// Lazy load heavy components
export const CartDrawer = dynamic(
  () => import('@/components/cart/cart-drawer').then(mod => mod.CartDrawer),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse">Loading cart...</div>
  }
)

export const ProductFilters = dynamic(
  () => import('@/components/products/filters'),
  { ssr: false }
)

export const StripeCheckout = dynamic(
  () => import('@/components/checkout/stripe-checkout'),
  { ssr: false }
)
```

#### 5.3 API Route Caching
```typescript
// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { medusa } from '@/lib/medusa/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await medusa.products.retrieve(params.id)
    
    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    )
  }
}
```

### Step 6: SEO & Analytics

#### 6.1 SEO Configuration
```typescript
// src/app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://strikeshop.com'),
  title: {
    default: 'Strike Shop - Premium E-commerce',
    template: '%s | Strike Shop',
  },
  description: 'Discover premium products at Strike Shop',
  keywords: ['e-commerce', 'online shopping', 'premium products'],
  authors: [{ name: 'Strike Shop' }],
  creator: 'Strike Shop',
  publisher: 'Strike Shop',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://strikeshop.com',
    siteName: 'Strike Shop',
    images: [
      {
        url: 'https://strikeshop.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Strike Shop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@strikeshop',
    creator: '@strikeshop',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Product page metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await medusa.products.retrieve(params.id)
  
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images.map(img => ({
        url: img.url,
        width: 1200,
        height: 630,
        alt: product.title,
      })),
    },
  }
}
```

#### 6.2 Analytics Setup
```typescript
// src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

export function AnalyticsProvider() {
  return (
    <>
      {/* Vercel Analytics */}
      <Analytics />
      <SpeedInsights />
      
      {/* Google Analytics */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        </>
      )}
    </>
  )
}

// E-commerce tracking
export function trackEcommerceEvent(
  eventName: string,
  eventParams: Record<string, any>
) {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
  
  // Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', eventName, eventParams)
  }
}
```

### Step 7: Deployment Configuration

#### 7.1 Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "sin1"],
  "functions": {
    "app/api/checkout/route.ts": {
      "maxDuration": 30
    },
    "app/api/webhook/stripe/route.ts": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.strikeshop.com/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ],
  "env": {
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL": "@medusa_backend_url",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe_publishable_key"
  }
}
```

#### 7.2 Environment Variables
```bash
# .env.production
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.strikeshop.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
NEXT_PUBLIC_GA_ID=G-YOUR_ID
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

## 🔒 Security Best Practices

### Content Security Policy
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  other: {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.stripe.com *.google-analytics.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: *.s3.amazonaws.com *.stripe.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\n/g, ' ').trim()
  }
}
```

### API Security
```typescript
// src/lib/api-security.ts
export function createSecureHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}
```

## 🚨 Error Handling

### Global Error Boundary
```typescript
// src/app/error.tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <button
        onClick={reset}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  )
}
```

## 📊 Monitoring & Performance

### Web Vitals Tracking
```typescript
// src/app/layout.tsx
import { WebVitalsReporter } from '@/components/web-vitals'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <WebVitalsReporter />
      </body>
    </html>
  )
}

// src/components/web-vitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics
    const body = JSON.stringify(metric)
    const url = '/api/analytics/vitals'

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body)
    } else {
      fetch(url, { body, method: 'POST', keepalive: true })
    }
  })

  return null
}
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run production build locally
- [ ] Test all API integrations
- [ ] Verify environment variables
- [ ] Run Lighthouse audit
- [ ] Test payment flows
- [ ] Check SEO metadata

### Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Or with GitHub integration
# 1. Connect repo to Vercel
# 2. Configure environment variables
# 3. Enable automatic deployments
```

### Post-Deployment
- [ ] Verify all pages load correctly
- [ ] Test checkout flow end-to-end
- [ ] Monitor error rates
- [ ] Check Core Web Vitals
- [ ] Verify analytics tracking
- [ ] Test edge middleware

## 📈 Scaling Strategies

### Performance Optimization
1. **Enable ISR** for product pages
2. **Use Edge Config** for feature flags
3. **Implement Redis caching** for API responses
4. **Use Vercel KV** for session storage
5. **Enable Image Optimization API**
6. **Implement Progressive Enhancement**

### Cost Optimization
1. **Monitor bandwidth usage**
2. **Optimize image sizes**
3. **Use efficient caching strategies**
4. **Implement request coalescing**
5. **Monitor function execution time**

This comprehensive frontend integration plan ensures a fast, secure, and scalable e-commerce experience on Vercel.