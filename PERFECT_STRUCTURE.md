# PERFECT NEXT.JS APP ROUTER STRUCTURE 2025
## World-Class E-commerce Architecture for Strike Shop

This document outlines the absolute perfect Next.js App Router structure following 2025 best practices for a world-class e-commerce application.

## 🏗️ CORE ARCHITECTURE PRINCIPLES

### 1. Route Organization Strategy
- **Route Groups**: Logical feature grouping with clear boundaries
- **Server-First**: Leverage server components for data fetching
- **Client Islands**: Strategic client components for interactivity
- **Co-location**: Keep related files close together
- **Progressive Enhancement**: Work without JavaScript, enhance with it

### 2. Component Architecture Philosophy
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Compound Components**: Self-contained feature components
- **Server vs Client**: Clear separation with optimal placement
- **Type Safety**: End-to-end TypeScript with strict configuration

---

## 📁 PERFECT FOLDER STRUCTURE

```
app/
├── (shop)/                           # Main shopping experience
│   ├── layout.tsx                    # Shop-specific layout
│   ├── loading.tsx                   # Shop loading UI
│   ├── error.tsx                     # Shop error boundary
│   ├── not-found.tsx                 # Shop 404 page
│   ├── page.tsx                      # Homepage (Server Component)
│   │
│   ├── collections/                  # Product collections
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx                  # Collections listing
│   │   └── [handle]/
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── not-found.tsx
│   │       └── page.tsx              # Single collection
│   │
│   ├── products/                     # Product catalog
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx                  # Products listing
│   │   └── [handle]/
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── not-found.tsx
│   │       ├── page.tsx              # Product details (Server)
│   │       └── opengraph-image.tsx   # Dynamic OG images
│   │
│   ├── categories/
│   │   ├── [slug]/
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── page.tsx
│   │   └── page.tsx
│   │
│   └── search/
│       ├── loading.tsx
│       ├── error.tsx
│       └── page.tsx
│
├── (checkout)/                       # Checkout flow
│   ├── layout.tsx                    # Checkout-specific layout
│   ├── cart/
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── page.tsx                  # Cart page
│   ├── checkout/
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── page.tsx                  # Checkout form
│   ├── thank-you/
│   │   └── page.tsx                  # Order confirmation
│   └── payment/
│       ├── loading.tsx
│       ├── error.tsx
│       └── page.tsx                  # Payment processing
│
├── (account)/                        # Customer account
│   ├── layout.tsx                    # Account layout with navigation
│   ├── loading.tsx
│   ├── error.tsx
│   ├── profile/
│   │   └── page.tsx                  # Profile management
│   ├── orders/
│   │   ├── page.tsx                  # Order history
│   │   └── [id]/
│   │       └── page.tsx              # Order details
│   ├── addresses/
│   │   └── page.tsx                  # Address book
│   ├── wishlist/
│   │   └── page.tsx                  # Saved items
│   └── settings/
│       └── page.tsx                  # Account settings
│
├── (auth)/                           # Authentication
│   ├── layout.tsx                    # Auth layout (minimal)
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   └── verify-email/
│       └── page.tsx
│
├── (admin)/                          # Admin panel
│   ├── layout.tsx                    # Admin layout with sidebar
│   ├── loading.tsx
│   ├── error.tsx
│   ├── page.tsx                      # Admin dashboard
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── customers/
│   │   └── page.tsx
│   └── analytics/
│       └── page.tsx
│
├── @modal/                           # Parallel route for modals
│   ├── default.tsx                   # Default modal slot
│   ├── (.)products/
│   │   └── [handle]/
│   │       └── page.tsx              # Intercepted product modal
│   ├── (.)cart/
│   │   └── page.tsx                  # Quick cart modal
│   └── (.)auth/
│       ├── sign-in/
│       │   └── page.tsx              # Auth modals
│       └── sign-up/
│           └── page.tsx
│
├── api/                              # API routes
│   ├── auth/                         # Authentication endpoints
│   │   ├── sign-in/
│   │   │   └── route.ts
│   │   ├── sign-up/
│   │   │   └── route.ts
│   │   ├── refresh/
│   │   │   └── route.ts
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── cart/                         # Cart management
│   │   ├── route.ts                  # GET cart
│   │   ├── add/
│   │   │   └── route.ts              # POST add item
│   │   ├── update/
│   │   │   └── route.ts              # PATCH update item
│   │   ├── remove/
│   │   │   └── route.ts              # DELETE remove item
│   │   └── clear/
│   │       └── route.ts              # DELETE clear cart
│   │
│   ├── checkout/                     # Checkout process
│   │   ├── create-session/
│   │   │   └── route.ts              # Stripe checkout session
│   │   ├── confirm-payment/
│   │   │   └── route.ts              # Payment confirmation
│   │   └── webhook/
│   │       └── route.ts              # Payment webhooks
│   │
│   ├── products/                     # Product operations
│   │   ├── route.ts                  # GET products with filters
│   │   ├── [handle]/
│   │   │   └── route.ts              # GET single product
│   │   ├── search/
│   │   │   └── route.ts              # Product search
│   │   └── recommendations/
│   │       └── route.ts              # Product recommendations
│   │
│   ├── admin/                        # Admin API endpoints
│   │   ├── auth/
│   │   │   └── route.ts
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── orders/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── analytics/
│   │       └── route.ts
│   │
│   ├── webhooks/                     # External webhooks
│   │   ├── stripe/
│   │   │   └── route.ts
│   │   ├── shopify/
│   │   │   └── route.ts
│   │   └── analytics/
│   │       └── route.ts
│   │
│   └── health/                       # Health checks
│       └── route.ts
│
├── globals.css                       # Global styles
├── layout.tsx                        # Root layout
├── loading.tsx                       # Global loading UI
├── error.tsx                         # Global error boundary
├── not-found.tsx                     # Global 404 page
├── robots.ts                         # Dynamic robots.txt
├── sitemap.ts                        # Dynamic sitemap
├── manifest.ts                       # PWA manifest
└── opengraph-image.tsx               # Default OG image
```

---

## 🧩 COMPONENT ARCHITECTURE

### 1. Component Organization Strategy

```
components/
├── ui/                               # Atomic UI components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── toast.tsx
│   ├── loading-spinner.tsx
│   ├── skeleton.tsx
│   └── index.ts                      # Barrel exports
│
├── forms/                            # Form components
│   ├── contact-form.tsx
│   ├── newsletter-form.tsx
│   ├── search-form.tsx
│   ├── auth-forms/
│   │   ├── sign-in-form.tsx
│   │   ├── sign-up-form.tsx
│   │   └── password-reset-form.tsx
│   └── checkout-forms/
│       ├── shipping-form.tsx
│       ├── billing-form.tsx
│       └── payment-form.tsx
│
├── layout/                           # Layout components
│   ├── header/
│   │   ├── header.tsx                # Main header (Server Component)
│   │   ├── navigation.tsx            # Navigation menu
│   │   ├── mobile-nav.tsx            # Mobile navigation
│   │   ├── cart-trigger.tsx          # Cart button (Client)
│   │   ├── search-trigger.tsx        # Search button (Client)
│   │   └── user-menu.tsx             # User dropdown (Client)
│   │
│   ├── footer/
│   │   ├── footer.tsx                # Main footer (Server Component)
│   │   ├── footer-nav.tsx            # Footer navigation
│   │   ├── newsletter-signup.tsx     # Newsletter form (Client)
│   │   └── social-links.tsx          # Social media links
│   │
│   └── sidebar/
│       ├── admin-sidebar.tsx
│       ├── filter-sidebar.tsx
│       └── mobile-sidebar.tsx
│
├── commerce/                         # E-commerce specific components
│   ├── product/
│   │   ├── product-card.tsx          # Product card (Server Component)
│   │   ├── product-grid.tsx          # Product grid (Server Component)
│   │   ├── product-list.tsx          # Product list (Server Component)
│   │   ├── product-details/
│   │   │   ├── product-gallery.tsx   # Image gallery (Client)
│   │   │   ├── product-info.tsx      # Product information (Server)
│   │   │   ├── product-actions.tsx   # Add to cart, etc. (Client)
│   │   │   ├── product-reviews.tsx   # Reviews section (Server)
│   │   │   └── product-recommendations.tsx (Server)
│   │   │
│   │   ├── product-filters/
│   │   │   ├── price-filter.tsx      # Price range (Client)
│   │   │   ├── category-filter.tsx   # Category selection (Client)
│   │   │   ├── brand-filter.tsx      # Brand selection (Client)
│   │   │   └── filter-wrapper.tsx    # Filter container (Client)
│   │   │
│   │   └── product-search/
│   │       ├── search-input.tsx      # Search input (Client)
│   │       ├── search-results.tsx    # Search results (Server)
│   │       ├── search-suggestions.tsx # Autocomplete (Client)
│   │       └── search-filters.tsx    # Search filters (Client)
│   │
│   ├── cart/
│   │   ├── cart-drawer.tsx           # Slide-out cart (Client)
│   │   ├── cart-item.tsx             # Cart item row (Client)
│   │   ├── cart-summary.tsx          # Cart totals (Client)
│   │   ├── add-to-cart-button.tsx    # Add to cart (Client)
│   │   ├── quantity-selector.tsx     # Quantity input (Client)
│   │   └── mini-cart.tsx             # Header cart preview (Client)
│   │
│   ├── checkout/
│   │   ├── checkout-form.tsx         # Main checkout form (Client)
│   │   ├── shipping-options.tsx      # Shipping selection (Client)
│   │   ├── payment-methods.tsx       # Payment selection (Client)
│   │   ├── order-summary.tsx         # Order review (Server)
│   │   └── checkout-progress.tsx     # Progress indicator (Client)
│   │
│   └── account/
│       ├── order-history.tsx         # Order list (Server)
│       ├── order-details.tsx         # Single order (Server)
│       ├── address-book.tsx          # Address management (Client)
│       ├── wishlist.tsx              # Saved items (Server)
│       └── profile-form.tsx          # Profile editor (Client)
│
├── marketing/                        # Marketing components
│   ├── hero-section.tsx              # Homepage hero (Server)
│   ├── featured-products.tsx         # Featured grid (Server)
│   ├── promotional-banner.tsx        # Promo banners (Server)
│   ├── testimonials.tsx              # Customer reviews (Server)
│   ├── newsletter-signup.tsx         # Email signup (Client)
│   └── social-proof.tsx              # Trust badges (Server)
│
├── admin/                            # Admin components
│   ├── dashboard/
│   │   ├── stats-cards.tsx           # Metric cards (Server)
│   │   ├── sales-chart.tsx           # Analytics chart (Client)
│   │   └── recent-orders.tsx         # Order list (Server)
│   │
│   ├── products/
│   │   ├── product-table.tsx         # Product data table (Server)
│   │   ├── product-form.tsx          # Product editor (Client)
│   │   └── bulk-actions.tsx          # Bulk operations (Client)
│   │
│   └── orders/
│       ├── order-table.tsx           # Order data table (Server)
│       ├── order-details.tsx         # Order management (Client)
│       └── order-status.tsx          # Status updates (Client)
│
├── providers/                        # Context providers
│   ├── cart-provider.tsx             # Cart state (Client)
│   ├── auth-provider.tsx             # Authentication (Client)
│   ├── theme-provider.tsx            # Theme switching (Client)
│   ├── toast-provider.tsx            # Notifications (Client)
│   └── query-provider.tsx            # React Query (Client)
│
└── shared/                           # Shared utilities
    ├── loading-states.tsx            # Loading skeletons
    ├── error-boundaries.tsx          # Error handling
    ├── modal-wrapper.tsx             # Modal container
    ├── page-wrapper.tsx              # Page layout
    └── seo-head.tsx                  # SEO meta tags
```

### 2. Server vs Client Component Strategy

#### Server Components (Default)
- **Product listings** - Static data, SEO important
- **Product details** - Static content, better performance
- **Navigation menus** - Mostly static
- **Footers** - Static content
- **Marketing content** - SEO critical
- **Admin tables** - Data-heavy, better server-side

#### Client Components (Selective)
- **Cart interactions** - Real-time updates
- **Search inputs** - User interaction
- **Product galleries** - Image zoom, carousel
- **Form inputs** - Validation, state
- **Modals/Drawers** - Interactive overlays
- **Filters** - Dynamic filtering

---

## 🗂️ STATE MANAGEMENT ARCHITECTURE

### Zustand Store Organization

```
lib/stores/
├── index.ts                          # Store configuration
├── types.ts                          # Store type definitions
├── middleware.ts                     # Store middleware (persist, devtools)
│
├── slices/                           # Feature-based store slices
│   ├── cart-slice.ts                 # Cart state management
│   ├── auth-slice.ts                 # Authentication state
│   ├── wishlist-slice.ts             # Wishlist state
│   ├── filters-slice.ts              # Product filters
│   ├── ui-slice.ts                   # UI state (modals, drawers)
│   └── admin-slice.ts                # Admin panel state
│
├── selectors/                        # Reusable selectors
│   ├── cart-selectors.ts             # Cart-related selectors
│   ├── product-selectors.ts          # Product-related selectors
│   └── ui-selectors.ts               # UI state selectors
│
└── actions/                          # Store actions
    ├── cart-actions.ts               # Cart operations
    ├── auth-actions.ts               # Auth operations
    └── wishlist-actions.ts           # Wishlist operations
```

### State Management Principles

1. **Server State vs Client State**
   - Server state: TanStack Query for API data
   - Client state: Zustand for UI and user preferences
   - Persistent state: Zustand persist middleware

2. **Store Slicing Strategy**
   - Feature-based slices for better maintainability
   - Minimal global state, maximize local state
   - Clear separation of concerns

3. **Form State Management**
   - React Hook Form for complex forms
   - Zod for validation schemas
   - Server actions for form submission

---

## 🚀 API LAYER ORGANIZATION

### Route Handler Structure

```
app/api/
├── middleware/                       # API middleware
│   ├── auth.ts                       # Authentication middleware
│   ├── cors.ts                       # CORS configuration
│   ├── rate-limit.ts                 # Rate limiting
│   ├── validation.ts                 # Request validation
│   └── error-handler.ts              # Error handling
│
├── lib/                              # API utilities
│   ├── shopify.ts                    # Shopify API client
│   ├── stripe.ts                     # Stripe API client
│   ├── database.ts                   # Database client
│   ├── auth.ts                       # Auth utilities
│   └── validation.ts                 # Validation schemas
│
├── types/                            # API type definitions
│   ├── requests.ts                   # Request types
│   ├── responses.ts                  # Response types
│   └── errors.ts                     # Error types
│
└── utils/                            # API helper functions
    ├── response-helpers.ts           # Response formatting
    ├── error-handling.ts             # Error handling
    ├── auth-helpers.ts               # Auth utilities
    └── validation-helpers.ts         # Validation utilities
```

### API Design Principles

1. **RESTful Design**
   - Consistent HTTP methods and status codes
   - Resource-based URLs
   - Proper error responses

2. **Security First**
   - Input validation on all endpoints
   - Rate limiting and CORS
   - Authentication and authorization

3. **Error Handling**
   - Consistent error response format
   - Proper error logging
   - User-friendly error messages

---

## 📚 UTILITY ORGANIZATION

### Type Definitions Structure

```
types/
├── index.ts                          # Main type exports
├── api/                              # API-related types
│   ├── requests.ts                   # Request types
│   ├── responses.ts                  # Response types
│   └── errors.ts                     # Error types
│
├── commerce/                         # Commerce types
│   ├── product.ts                    # Product types
│   ├── cart.ts                       # Cart types
│   ├── order.ts                      # Order types
│   ├── customer.ts                   # Customer types
│   └── payment.ts                    # Payment types
│
├── ui/                               # UI component types
│   ├── components.ts                 # Component prop types
│   ├── forms.ts                      # Form types
│   └── layout.ts                     # Layout types
│
├── auth/                             # Authentication types
│   ├── user.ts                       # User types
│   ├── session.ts                    # Session types
│   └── permissions.ts                # Permission types
│
└── shared/                           # Shared utility types
    ├── common.ts                     # Common types
    ├── branded.ts                    # Branded types
    └── utilities.ts                  # Utility types
```

### Utility Functions Organization

```
lib/utils/
├── index.ts                          # Main utility exports
├── formatting/                       # Data formatting
│   ├── currency.ts                   # Price formatting
│   ├── date.ts                       # Date formatting
│   ├── text.ts                       # Text utilities
│   └── url.ts                        # URL utilities
│
├── validation/                       # Validation utilities
│   ├── schemas.ts                    # Zod schemas
│   ├── rules.ts                      # Validation rules
│   └── helpers.ts                    # Validation helpers
│
├── api/                              # API utilities
│   ├── fetch.ts                      # Fetch wrappers
│   ├── cache.ts                      # Cache utilities
│   └── error-handling.ts             # Error handling
│
├── auth/                             # Auth utilities
│   ├── session.ts                    # Session management
│   ├── permissions.ts                # Permission checking
│   └── tokens.ts                     # Token utilities
│
└── commerce/                         # Commerce utilities
    ├── cart.ts                       # Cart calculations
    ├── pricing.ts                    # Price calculations
    ├── inventory.ts                  # Inventory utilities
    └── shipping.ts                   # Shipping calculations
```

### Custom Hooks Organization

```
hooks/
├── index.ts                          # Hook exports
├── api/                              # API hooks
│   ├── use-products.ts               # Product queries
│   ├── use-cart.ts                   # Cart operations
│   ├── use-orders.ts                 # Order queries
│   └── use-auth.ts                   # Auth operations
│
├── ui/                               # UI hooks
│   ├── use-toast.ts                  # Toast notifications
│   ├── use-modal.ts                  # Modal management
│   ├── use-drawer.ts                 # Drawer management
│   └── use-theme.ts                  # Theme switching
│
├── commerce/                         # Commerce hooks
│   ├── use-cart-sync.ts              # Cart synchronization
│   ├── use-wishlist.ts               # Wishlist management
│   ├── use-checkout.ts               # Checkout flow
│   └── use-search.ts                 # Product search
│
├── forms/                            # Form hooks
│   ├── use-form-validation.ts        # Form validation
│   ├── use-form-persistence.ts       # Form persistence
│   └── use-multi-step-form.ts        # Multi-step forms
│
└── utilities/                        # Utility hooks
    ├── use-debounce.ts              # Debouncing
    ├── use-local-storage.ts         # Local storage
    ├── use-media-query.ts           # Media queries
    └── use-intersection-observer.ts  # Intersection observer
```

---

## 🎨 STYLING ARCHITECTURE

### Tailwind Configuration Structure

```
styles/
├── globals.css                       # Global styles and CSS variables
├── components.css                    # Component-specific styles
├── utilities.css                     # Custom utility classes
│
├── tokens/                           # Design tokens
│   ├── colors.css                    # Color variables
│   ├── typography.css                # Font variables
│   ├── spacing.css                   # Spacing variables
│   ├── shadows.css                   # Shadow variables
│   └── animations.css                # Animation variables
│
├── components/                       # Component styles
│   ├── button.css                    # Button variants
│   ├── card.css                      # Card styles
│   ├── form.css                      # Form styles
│   └── navigation.css                # Navigation styles
│
└── layouts/                          # Layout styles
    ├── grid.css                      # Grid systems
    ├── container.css                 # Container styles
    └── responsive.css                # Responsive utilities
```

### Design System Integration

```
components/ui/
├── design-system/                    # Design system components
│   ├── primitives/                   # Base primitives
│   │   ├── box.tsx                   # Layout primitive
│   │   ├── stack.tsx                 # Spacing primitive
│   │   ├── text.tsx                  # Text primitive
│   │   └── flex.tsx                  # Flex primitive
│   │
│   ├── tokens/                       # Design tokens
│   │   ├── colors.ts                 # Color tokens
│   │   ├── typography.ts             # Typography tokens
│   │   ├── spacing.ts                # Spacing tokens
│   │   └── breakpoints.ts            # Breakpoint tokens
│   │
│   └── themes/                       # Theme configurations
│       ├── light.ts                  # Light theme
│       ├── dark.ts                   # Dark theme
│       └── brand.ts                  # Brand theme
│
└── styled/                           # Styled components
    ├── button.tsx                    # Styled button variants
    ├── input.tsx                     # Styled input variants
    ├── card.tsx                      # Styled card variants
    └── navigation.tsx                # Styled navigation variants
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Import Strategy

```
lib/optimizations/
├── dynamic-imports.ts                # Dynamic component loading
├── bundle-splitting.ts               # Code splitting strategies
├── preloading.ts                     # Resource preloading
└── lazy-loading.ts                   # Lazy loading utilities

// Example: Dynamic imports for heavy components
const ProductGallery = dynamic(() => import('@/components/commerce/product/product-gallery'), {
  loading: () => <ProductGallerySkeleton />,
  ssr: false // Client-side only for better performance
})

const AdminChart = dynamic(() => import('@/components/admin/dashboard/sales-chart'), {
  loading: () => <ChartSkeleton />
})
```

### Asset Organization

```
public/
├── images/                           # Static images
│   ├── products/                     # Product images
│   ├── marketing/                    # Marketing images
│   ├── icons/                        # Icon files
│   └── placeholders/                 # Placeholder images
│
├── fonts/                            # Font files
│   ├── inter/                        # Inter font family
│   └── heading/                      # Heading font family
│
├── icons/                            # PWA icons
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
│
└── static/                           # Static assets
    ├── manifest.json                 # PWA manifest
    ├── robots.txt                    # SEO robots
    └── sitemap.xml                   # SEO sitemap
```

---

## 🧪 TESTING STRUCTURE

### Test Organization

```
__tests__/
├── components/                       # Component tests
│   ├── ui/                          # UI component tests
│   ├── commerce/                    # Commerce component tests
│   └── layout/                      # Layout component tests
│
├── pages/                           # Page tests
│   ├── shop/                        # Shop page tests
│   ├── checkout/                    # Checkout page tests
│   └── account/                     # Account page tests
│
├── api/                             # API route tests
│   ├── auth/                        # Auth endpoint tests
│   ├── cart/                        # Cart endpoint tests
│   └── products/                    # Product endpoint tests
│
├── hooks/                           # Custom hook tests
│   ├── api/                         # API hook tests
│   ├── ui/                          # UI hook tests
│   └── commerce/                    # Commerce hook tests
│
├── utils/                           # Utility function tests
│   ├── formatting/                  # Formatting tests
│   ├── validation/                  # Validation tests
│   └── api/                         # API utility tests
│
├── e2e/                             # End-to-end tests
│   ├── shop/                        # Shopping flow tests
│   ├── checkout/                    # Checkout flow tests
│   └── admin/                       # Admin flow tests
│
└── fixtures/                        # Test data
    ├── products.json                # Product test data
    ├── users.json                   # User test data
    └── orders.json                  # Order test data
```

---

## 📝 CONFIGURATION FILES

### Essential Configuration Structure

```
project-root/
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── eslint.config.js                  # ESLint configuration
├── prettier.config.js                # Prettier configuration
├── jest.config.js                    # Jest testing configuration
├── playwright.config.ts              # Playwright E2E configuration
├── vitest.config.ts                  # Vitest unit test configuration
├── package.json                      # Dependencies and scripts
├── .env.local                        # Local environment variables
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
├── .dockerignore                     # Docker ignore rules
├── Dockerfile                        # Docker configuration
├── docker-compose.yml                # Docker Compose configuration
└── README.md                         # Project documentation
```

---

## 🔧 DEVELOPER EXPERIENCE

### Import Path Configuration

```typescript
// tsconfig.json path mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"],
      "@/styles/*": ["./styles/*"],
      "@/public/*": ["./public/*"],
      "@/app/*": ["./app/*"]
    }
  }
}
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "analyze": "ANALYZE=true next build",
    "dev:https": "next dev --experimental-https"
  }
}
```

---

## 📚 NAMING CONVENTIONS

### File Naming Standards

- **Components**: PascalCase (`ProductCard.tsx`)
- **Pages**: kebab-case (`product-details.tsx`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase (`Product.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Hooks**: camelCase with "use" prefix (`useCart.ts`)
- **Stores**: kebab-case with "store" suffix (`cart-store.ts`)

### Component Naming Patterns

```typescript
// ✅ Good naming patterns
export const ProductCard = () => {}
export const CartDrawer = () => {}
export const CheckoutForm = () => {}
export const AdminDashboard = () => {}

// ✅ Compound component patterns
export const ProductDetails = {
  Root: ProductDetailsRoot,
  Gallery: ProductGallery,
  Info: ProductInfo,
  Actions: ProductActions,
  Reviews: ProductReviews
}

// ✅ Hook naming patterns
export const useCart = () => {}
export const useProductQuery = () => {}
export const useCheckoutFlow = () => {}
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Environment Structure

```
environments/
├── development/
│   ├── .env.development
│   └── docker-compose.dev.yml
│
├── staging/
│   ├── .env.staging
│   └── docker-compose.staging.yml
│
├── production/
│   ├── .env.production
│   └── docker-compose.prod.yml
│
└── local/
    ├── .env.local
    └── docker-compose.local.yml
```

### Build Optimization

```typescript
// next.config.js optimizations
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@shopify/admin-api-client'],
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  images: {
    domains: ['cdn.shopify.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
    return config
  }
}
```

---

## 🎯 BEST PRACTICES SUMMARY

### 1. Architecture Principles
- **Server-first**: Leverage server components for better performance
- **Progressive enhancement**: Ensure functionality without JavaScript
- **Type safety**: End-to-end TypeScript with strict configuration
- **Performance**: Optimize for Core Web Vitals
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO**: Semantic HTML and proper meta tags

### 2. Code Organization
- **Feature-based**: Group related files together
- **Separation of concerns**: Clear boundaries between layers
- **Reusability**: Shared components and utilities
- **Consistency**: Consistent naming and patterns
- **Documentation**: Clear documentation and examples

### 3. Performance Optimization
- **Bundle splitting**: Optimize JavaScript bundles
- **Image optimization**: Use Next.js Image component
- **Lazy loading**: Load components when needed
- **Caching**: Implement proper caching strategies
- **Preloading**: Preload critical resources

### 4. Developer Experience
- **TypeScript**: Full type safety
- **ESLint/Prettier**: Code quality and formatting
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear setup and usage guides
- **Debugging**: Proper error handling and logging

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Set up route groups and layouts
- [ ] Configure TypeScript and ESLint
- [ ] Set up design system and UI components
- [ ] Implement authentication system
- [ ] Set up state management with Zustand

### Phase 2: Core Features
- [ ] Implement product catalog
- [ ] Build shopping cart functionality
- [ ] Create checkout flow
- [ ] Set up payment processing
- [ ] Implement user account features

### Phase 3: Enhancement
- [ ] Add search functionality
- [ ] Implement product recommendations
- [ ] Create admin panel
- [ ] Add analytics and monitoring
- [ ] Optimize performance

### Phase 4: Production
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring and logging
- [ ] Implement security measures
- [ ] Optimize for SEO
- [ ] Deploy to production

---

This structure represents the absolute best practices for a Next.js App Router e-commerce application in 2025. It prioritizes performance, maintainability, developer experience, and scalability while following modern React and Next.js patterns.