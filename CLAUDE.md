# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands to Run

### Frontend Development
```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run analyze      # Bundle size analysis
```

### Backend (Medusa)
```bash
cd my-medusa-store
pnpm run dev         # Start Medusa development server
pnpm run build       # Build Medusa backend
pnpm run seed        # Seed products and data
pnpm run start       # Start production server
```

### Testing (Medusa)
```bash
cd my-medusa-store
pnpm run test:unit                # Unit tests
pnpm run test:integration:http    # HTTP integration tests
pnpm run test:integration:modules # Module integration tests
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Medusa.js v2.8.4 (e-commerce API)
- **CMS**: Sanity (content management)
- **Database**: PostgreSQL (Medusa backend)
- **State**: Zustand for client state management
- **Auth**: Clerk authentication system
- **Payments**: Stripe integration

### Key Design Patterns

#### Data Integration Layer
The `lib/data-service.ts` is the core integration layer that merges data from multiple sources:
- **Sanity**: Product content, images, descriptions, categories
- **Medusa**: Inventory, pricing, variants, cart operations
- **Combined**: Creates `IntegratedProduct` type with unified data structure

#### State Management
- **Cart Store** (`lib/cart-store.ts`): Full Medusa cart integration with persistence
- **Auth Store** (`lib/auth-store.ts`): User authentication state
- **Wishlist Store** (`lib/wishlist-store.ts`): User favorites

#### Client/Server Boundaries

##### Server Components (Default)
Server Components run on the server and send HTML to the client. Use for:
- Data fetching (database queries, API calls)
- Accessing backend resources directly
- Keeping sensitive information on server (API keys, tokens)
- Large dependencies that would increase client bundle size
- Static content that doesn't need interactivity

Benefits:
- Zero bundle size impact
- Direct database/API access
- Better SEO
- Faster initial page load

Example:
```tsx
// app/products/page.tsx - Server Component (no "use client")
async function ProductsPage() {
  const products = await fetchProducts() // Direct API call
  return <ProductGrid products={products} />
}
```

##### Client Components
Client Components run in the browser. Use `"use client"` directive for:
- Event handlers (onClick, onChange, etc.)
- Hooks (useState, useEffect, useContext, etc.)
- Browser-only APIs (window, document, localStorage)
- Custom hooks that use state or effects
- Class components (if any)
- Libraries that use React state

Example:
```tsx
// components/add-to-cart-button.tsx
"use client"

import { useState } from 'react'
import { useCartStore } from '@/lib/cart-store'

export function AddToCartButton({ product }) {
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore(state => state.addItem)
  // ... interactive logic
}
```

##### Best Practices
1. **Composition Pattern**: Server Components can import Client Components
   ```tsx
   // Server Component
   import { ClientInteractiveButton } from './client-button'
   
   export default async function ServerProductCard({ id }) {
     const product = await getProduct(id) // Server-side fetch
     return (
       <div>
         <h2>{product.name}</h2>
         <ClientInteractiveButton product={product} />
       </div>
     )
   }
   ```

2. **Props Serialization**: Props passed from Server to Client Components must be serializable
   - ✅ Primitives, arrays, objects, Date
   - ❌ Functions, classes, JSX elements

3. **Context Providers**: Must be Client Components, wrap Server Components
   ```tsx
   // app/layout.tsx
   import { Providers } from './providers' // Client Component
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <Providers>{children}</Providers>
         </body>
       </html>
     )
   }
   ```

4. **Data Fetching**: Prefer Server Components for data fetching
   - Use Server Components with async/await
   - Pass data as props to Client Components
   - Avoid useEffect for initial data fetching

5. **Third-party Components**: Wrap in Client Components if they use hooks
   ```tsx
   // components/ui/carousel-wrapper.tsx
   "use client"
   
   import { Carousel } from 'some-carousel-library'
   export { Carousel }
   ```

### File Organization
```
app/                    # Next.js App Router pages
├── [category]/         # Dynamic category pages
├── checkout/           # Checkout flow
├── product/[slug]/     # Product detail pages
├── admin/              # Admin dashboard
└── api/                # API routes (webhooks, middleware)

components/
├── ui/                 # shadcn/ui components
├── admin/              # Admin-specific components
├── checkout/           # Checkout flow components
└── [feature]/          # Feature-specific components

lib/
├── data-service.ts     # Core data integration layer
├── medusa.ts          # Medusa client configuration
├── sanity.ts          # Sanity client configuration
├── cart-store.ts      # Zustand cart state
├── auth-store.ts      # Authentication state
└── stripe.ts          # Stripe payment integration

sanity/
├── schemaTypes/       # Content schemas
└── lib/               # Sanity utilities

my-medusa-store/       # Separate Medusa backend
```

### Data Flow

#### Product Display
1. Sanity provides content (title, description, images, categories)
2. Medusa provides commerce data (pricing, inventory, variants)
3. `DataService` merges both into `IntegratedProduct`
4. Components receive unified product data

#### Cart Operations
1. UI actions trigger cart store methods
2. Cart store calls Medusa APIs directly
3. State updates automatically via Zustand
4. UI re-renders with new cart state

#### Authentication
1. Clerk handles auth UI and JWT tokens
2. Auth store manages user state
3. Medusa customer operations use JWT for auth

### Development Guidelines

#### TypeScript
- Strict mode enabled in `tsconfig.json`
- No `any` types - use proper type definitions
- Interface definitions in component files or `types/`

#### Component Patterns
- Server Components by default for data fetching
- Client Components only for interactivity
- Error boundaries for production reliability
- Loading states for all async operations

#### State Management
- Use Zustand stores for complex client state
- Server state via Next.js data fetching
- Persist critical state (cart, auth) via Zustand middleware

#### Styling
- Tailwind CSS with `@apply` for complex components
- shadcn/ui for consistent component library
- Mobile-first responsive design
- CSS custom properties for theming

### Integration Points

#### Medusa Integration
- Direct API calls via `@medusajs/medusa-js`
- Cart operations through store-based methods
- Admin operations for product management
- Webhook handling in `app/api/webhooks/`

#### Sanity Integration
- Content fetching via GROQ queries
- Image optimization through Sanity CDN
- Studio integration at `/studio`
- Schema definitions in `sanity/schemaTypes/`

#### Stripe Integration
- Payment intents for checkout
- Webhook handling for order confirmation
- Customer payment methods
- Subscription support (if needed)

### Performance Considerations
- Server Components for initial page loads
- Client Components only where interactivity needed
- Image optimization via Next.js Image component
- Bundle analysis via `npm run analyze`
- Lazy loading for non-critical components

### Testing Workflow
After completing any significant development work, run a comprehensive 30-minute testing phase:

#### 1. Build & Type Checking (5 minutes)
```bash
npm run build        # Ensure no build errors
npm run lint         # Check for linting issues
npx tsc --noEmit    # TypeScript type checking
```

#### 2. Visual & Functional Testing (15 minutes)
- Test all user flows (browse, search, add to cart, checkout)
- Test on different viewport sizes (mobile, tablet, desktop)
- Test all interactive components (modals, dropdowns, forms)
- Verify proper loading states and error handling
- Check accessibility (keyboard navigation, screen reader)

#### 3. Performance Testing (5 minutes)
```bash
npm run analyze      # Check bundle sizes
# Run Lighthouse in Chrome DevTools
# Check Core Web Vitals
```

#### 4. Cross-browser Testing (5 minutes)
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)
- Mobile browsers

#### Critical Paths to Test
1. **Product Discovery**
   - Homepage loads correctly
   - Category pages display products
   - Search functionality works
   - Filters update products correctly

2. **Product Details**
   - Product pages load with correct data
   - Image gallery functions properly
   - Size selection works
   - Add to cart succeeds

3. **Cart & Checkout**
   - Cart updates correctly
   - Quantity changes work
   - Cart persists on refresh
   - Checkout flow completes

4. **User Account**
   - Sign in/up works
   - Wishlist functionality
   - Order history displays

5. **Admin Functions**
   - Admin login works
   - Product management
   - Order management

#### Test Data Requirements
- Ensure test products exist in both Sanity and Medusa
- Have test user accounts ready
- Use test payment credentials for Stripe