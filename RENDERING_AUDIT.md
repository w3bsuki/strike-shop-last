# Strike Shop - Complete Rendering Audit

## 🎯 Purpose
This document maps ALL code currently rendering in the Strike Shop application to prevent breaking user-visible functionality during refactoring. Everything listed here is ACTIVELY USED and must be preserved.

---

## 📱 Application Structure Overview

### Core App Files & Routes

**Root Layout** (`app/layout.tsx`)
- Universal HTML structure with PWA support
- Provider wrappers: `ProvidersWrapper`, error boundaries
- Global components: `SkipLink`, `AppErrorBoundary`, `CartInitializer`, `ServiceWorkerProvider`, `PWAInstallPrompt`
- Comprehensive SEO metadata and structured data
- Font preloading and performance optimizations

**Provider System**
- `app/providers-wrapper.tsx` - Main provider orchestration
- `app/providers-client.tsx` - Client-side providers
- `app/providers-server.tsx` - Server-side providers

---

## 🛍️ Shop Routes (Public)

### Homepage (`app/(shop)/page.tsx`)
**Layout Structure:**
```
SiteHeader
├── NewsletterBanner (top banner)
├── NavBar (desktop navigation)
├── MobileNav (mobile hamburger menu)
├── SearchBar
└── UserNav (cart, wishlist, account)

HeroSection
├── Hero image with overlay
├── Title: "STRIKE SS25"
├── CTA button: "EXPLORE COLLECTION"
└── Marquee: shipping/quality messages

HomePageClient (streamed content)
├── CategorySection
├── Winter Sale Banner (70% OFF)
├── ProductShowcase (Sale Collection)
├── DividerSection ("LUXURY STREETWEAR")
├── ProductShowcase (New Arrivals)
├── DividerSection ("PREMIUM QUALITY")
├── ProductShowcase (Featured Footwear)
├── DividerSection ("NEXT GENERATION")
├── ProductShowcase (Kids Collection - conditional)
├── DividerSection ("COMMUNITY")
└── CommunityShowcase (Instagram posts & reviews)

Footer
MobileNav (bottom navigation)
QuickViewModal (overlay)
```

### Category Pages (`app/(shop)/[category]/page.tsx`)
**Available Categories:**
- `/men` - Men's collection
- `/women` - Women's collection  
- `/kids` - Kids collection
- `/sale` - Sale items
- `/new-arrivals` - New products
- `/sneakers` - Footwear
- `/accessories` - Accessories

**Layout Structure:**
```
SiteHeader
CategoryPageClient
├── Category header with title
├── Product grid (responsive 2-4 columns)
├── Product filters and sorting
└── Pagination controls
Footer
QuickViewModal
```

### Product Detail Pages (`app/(shop)/product/[slug]/page.tsx`)
**Layout Structure:**
```
SiteHeader
ProductPageClient
├── Product image gallery
├── Product information panel
│   ├── Product title and price
│   ├── Size selector
│   ├── Color variants
│   ├── Add to cart button
│   ├── Wishlist button
│   ├── Product description
│   └── Size guide
├── Product recommendations
└── Reviews section
Footer
```

### Search Page (`app/(shop)/search/page.tsx`)
**Layout Structure:**
```
SiteHeader
SearchPageComponent
├── Search input (pre-filled with query)
├── Search results message
└── "Coming soon" placeholder
Footer
```

### Collections Page (`app/(shop)/collections/page.tsx`)
**Layout Structure:**
```
SiteHeader
Collections grid display
Footer
```

---

## 🛒 Cart & Checkout

### Cart Modal (`app/@modal/cart/page.tsx`)
**Layout Structure:**
```
CartSidebar (dynamic import)
├── Cart header with close button
├── Cart items list
│   ├── Product images
│   ├── Product names and variants
│   ├── Quantity controls
│   └── Remove buttons
├── Cart summary
│   ├── Subtotal
│   ├── Shipping estimation
│   └── Total
└── Checkout button
```

### Checkout Page (`app/(checkout)/checkout/page.tsx`)
**Layout Structure:**
```
SiteHeader
Multi-step checkout form
├── Progress indicator (1. Information, 2. Shipping, 3. Payment)
├── Contact information form
├── Shipping address form
├── Shipping method selection
├── Order summary sidebar
│   ├── Product list with images
│   ├── Pricing breakdown
│   └── Trust badges
└── Payment redirect to Shopify
Footer
```

### Order Confirmation (`app/(checkout)/order-confirmation/page.tsx`)
**Layout Structure:**
```
SiteHeader
Confirmation content
├── Success checkmark icon
├── "Order Confirmed!" heading
├── Order details panel
├── Next steps (Processing & Shipping)
└── Action buttons (Continue Shopping, View Orders)
Footer
```

---

## 👤 User Account System

### Sign In (`app/(auth)/sign-in/page.tsx`)
**Layout Structure:**
```
Centered auth form
├── "Sign in to your account" header
├── Email/password fields
├── "Forgot password?" link
├── Sign in button
├── Social login options (Google, GitHub)
└── Link to sign up
```

### Sign Up (`app/(auth)/sign-up/page.tsx`)
Similar layout to sign-in with registration fields

### Account Dashboard (`app/(account)/account/page.tsx`)
**Layout Structure:**
```
SiteHeader
Account management interface
├── Tab navigation (Profile, Orders, Addresses, Settings)
├── Profile information form
├── Order history (empty state)
├── Saved addresses (empty state)
└── Account settings (change password, sign out)
Footer
```

### Wishlist (`app/(account)/wishlist/page.tsx`)
User's saved products display

---

## 🔧 Admin Interface

### Admin Dashboard (`app/admin/page.tsx`)
**Layout Structure:**
```
AdminDashboard (dynamic import)
├── Admin navigation sidebar
├── Dashboard metrics
├── Quick actions
└── Recent activity
```

### Admin Products (`app/admin/products/page.tsx`)
Product management interface

### Admin Orders (`app/admin/orders/page.tsx`)
Order management interface

### Admin Users (`app/admin/users/page.tsx`)
User management interface

### Admin Login (`app/admin/login/page.tsx`)
Admin authentication

---

## 🧩 Critical Components

### Navigation System
**SiteHeader** (`components/navigation/site-header.tsx`)
```
NewsletterBanner
Header container
├── Desktop layout
│   ├── STRIKE™ logo
│   ├── NavBar (main navigation)
│   └── UserNav (search, account, cart)
└── Mobile layout
    ├── MobileNav (hamburger menu)
    ├── STRIKE™ logo (centered)
    └── UserNav (cart only)
```

**NavBar** (`components/navigation/navbar.tsx`)
- Main navigation menu items with badges
- Hidden on mobile, shown on desktop

**MobileNav** (`components/navigation/mobile-nav.tsx`)
- Sheet-based mobile menu
- Navigation sections: Shop, Account
- Help & Support link

**UserNav** (`components/navigation/user-nav/`)
- Wishlist button (authenticated users only)
- User menu dropdown
- Cart button with item count

### Product Display Components
**ProductCard** (`components/product/product-card.tsx`)
- Product image with lazy loading
- Product badges (NEW, SALE, etc.)
- Product name and pricing
- Quick view and wishlist actions
- Hover effects and animations

**ProductShowcase** (`components/product/product-showcase.tsx`)
- Horizontal scrolling product grids
- Section headers with "View All" links
- Product badges and descriptions

### Layout Components
**HeroSection** (`components/hero-section.tsx`)
- Large background image
- Overlay text: "STRIKE SS25"
- CTA button
- Animated marquee footer

**Footer** (`components/footer/footer.tsx`)
- Newsletter signup
- Footer navigation sections
- Social media links
- Legal information

**CategoryScroll** (`components/category/category-scroll.tsx`)
- Horizontal scrolling category cards
- Touch/swipe support

### Modal & Overlay Components
**QuickViewModal** (`components/QuickViewModal.tsx`)
- Product quick preview
- Add to cart functionality
- Image gallery

**CartSidebar** (`components/cart-sidebar.tsx`)
- Slide-out cart interface
- Cart item management
- Checkout integration

---

## 📊 Data Flow & State Management

### Data Sources
**Shopify Integration**
- Product data via `ShopifyService`
- Collections and categories
- Inventory and pricing
- Product images and variants

**Cart Management**
- Zustand store (`useCartStore`)
- Local storage persistence
- Cart item operations (add, remove, update)

**User Authentication**
- Supabase auth provider
- User profile management
- Protected routes

### API Routes
**Cart Operations** (`app/api/cart/`)
- `POST /api/cart/add` - Add items to cart
- `POST /api/cart/remove` - Remove items
- `PUT /api/cart/update` - Update quantities
- `GET /api/cart` - Get cart contents

**Other APIs**
- `/api/csrf-token` - CSRF protection
- `/api/reviews/[productId]` - Product reviews
- `/api/community-fits` - Community content
- `/api/analytics/errors` - Error tracking
- `/api/health` - Health check

---

## 🎨 UI Component Library

### Core UI Components (`components/ui/`)
**Form Components:**
- `input.tsx` - Text inputs with validation styles
- `button.tsx` - Primary, secondary, destructive variants
- `label.tsx` - Form labels
- `textarea.tsx` - Multi-line text input
- `select.tsx` - Dropdown selectors
- `checkbox.tsx` - Checkboxes with custom styling
- `radio-group.tsx` - Radio button groups
- `switch.tsx` - Toggle switches

**Layout Components:**
- `card.tsx` - Content cards with headers/footers
- `tabs.tsx` - Tabbed interfaces
- `accordion.tsx` - Collapsible content sections
- `separator.tsx` - Visual dividers
- `breadcrumb.tsx` - Navigation breadcrumbs

**Feedback Components:**
- `alert.tsx` - Alert messages (success, error, warning)
- `toast.tsx` + `toaster.tsx` - Toast notifications
- `skeleton.tsx` - Loading placeholders
- `loading-states.tsx` - Various loading animations
- `progress.tsx` - Progress indicators

**Navigation Components:**
- `navigation-menu.tsx` - Advanced navigation menus
- `pagination.tsx` - Page navigation
- `command.tsx` - Command palette interface

**Overlay Components:**
- `dialog.tsx` - Modal dialogs
- `sheet.tsx` - Slide-out panels
- `popover.tsx` - Floating content
- `hover-card.tsx` - Hover-triggered cards
- `tooltip.tsx` - Tooltips
- `alert-dialog.tsx` - Confirmation dialogs
- `drawer.tsx` - Mobile-friendly drawers

**Data Display:**
- `table.tsx` - Data tables
- `badge.tsx` - Status badges
- `avatar.tsx` - User avatars
- `aspect-ratio.tsx` - Image containers

**Interactive Components:**
- `toggle.tsx` + `toggle-group.tsx` - Toggle buttons
- `slider.tsx` - Range sliders
- `scroll-area.tsx` - Custom scrollbars
- `collapsible.tsx` - Expandable sections

### Specialized Components
**Product Components:**
- `product-sort.tsx` - Product sorting controls
- `product-price.tsx` - Price display formatting
- `product-badge.tsx` - Product status badges
- `wishlist-button.tsx` - Save to wishlist

**Loading & Error States:**
- `admin-skeleton.tsx` - Admin loading states
- `table-skeleton.tsx` - Table loading states
- `studio-skeleton.tsx` - Content loading states

**Accessibility Components:**
- `skip-link.tsx` - Skip navigation link
- `form-field.tsx` - Accessible form fields
- `keyboard-navigation.tsx` - Keyboard support

---

## 📱 Mobile & PWA Features

### Mobile Navigation
**Bottom Navigation** (`components/mobile/navigation/`)
- Fixed bottom navigation bar
- Home, Categories, Search, Account, Cart icons
- Active state indicators
- Label display options

### Progressive Web App
**PWA Components:**
- `PWAInstallPrompt` - Install app banner
- `ServiceWorkerProvider` - SW registration
- `ViewportHeightHandler` - Mobile viewport fixes

**PWA Manifest** (`app/manifest.ts`)
- App name, description, icons
- Theme colors and display mode
- Start URL and orientation

---

## 🔍 Search & Discovery

### Search Functionality
**SearchBar** (`components/navigation/search-bar.tsx`)
- Icon and expanded variants
- Search query handling
- Keyboard navigation

### Category System
**Category Components:**
- Category cards with images and counts
- Category scroll containers
- Category icons and branding

---

## ⚠️ Error Handling & Fallbacks

### Error Boundaries
- `AppErrorBoundary` - App-level error catching
- `ErrorBoundary` - Component-level error handling
- `CheckoutError` - Checkout-specific errors

### Loading States
- Comprehensive skeleton screens
- Progressive loading with Suspense
- Fallback content for failed loads

### Not Found Pages
- `app/not-found.tsx` - 404 error page
- `app/global-error.tsx` - Global error handler

---

## 🎯 Critical User Flows

### Shopping Flow
1. **Homepage** → Hero → Categories → Products
2. **Product Discovery** → Category pages → Product cards
3. **Product Details** → Image gallery → Add to cart
4. **Cart Management** → Cart sidebar → Quantity updates
5. **Checkout** → Information → Shipping → Payment
6. **Order Confirmation** → Success → Order tracking

### Account Flow
1. **Authentication** → Sign in/up → Social providers
2. **Account Management** → Profile → Orders → Settings
3. **Wishlist** → Save products → View saved items

### Admin Flow
1. **Admin Login** → Dashboard → Management interfaces
2. **Product Management** → Add/edit products
3. **Order Management** → View/process orders
4. **User Management** → User administration

---

## 🚨 DO NOT TOUCH LIST

### Critical Files (Breaking = Site Down)
- `app/layout.tsx` - Root layout
- `app/(shop)/page.tsx` - Homepage
- `components/navigation/site-header.tsx` - Main navigation
- `components/navigation/user-nav/` - User navigation
- `components/footer/footer.tsx` - Footer
- `app/(shop)/product/[slug]/page.tsx` - Product pages
- All cart-related components and API routes
- Authentication system files

### High-Traffic Components
- ProductCard and related product display components
- Navigation components (mobile and desktop)
- Cart and checkout components
- Search functionality
- Homepage hero and product showcases

### Essential UI Components
- All button, input, and form components
- Modal and overlay systems (dialog, sheet, etc.)
- Loading states and error handling
- Mobile navigation and PWA components

---

## ✅ Refactoring Guidelines

### Safe to Refactor
1. **Internal component logic** - As long as props/exports stay the same
2. **Styling** - CSS changes that don't break responsive design
3. **Performance optimizations** - React.memo, useMemo, etc.
4. **Type definitions** - Adding/improving TypeScript types

### Requires Careful Testing
1. **State management** - Cart store, user auth
2. **API integrations** - Shopify service calls
3. **Form validation** - Checkout and auth forms
4. **Mobile responsive behavior**

### Must Preserve
1. **All user-visible elements** listed in this audit
2. **Accessibility features** - ARIA labels, keyboard navigation
3. **SEO metadata** - Structured data, meta tags
4. **Performance features** - Lazy loading, code splitting
5. **PWA functionality** - Service worker, manifest

---

## 🔄 Update Requirements

**This audit must be updated when:**
- New pages or routes are added
- New components are created that render UI
- User flows are modified
- Navigation structure changes
- API endpoints are added/modified

**Last Updated:** December 30, 2024
**Audit Coverage:** Complete - All rendering components mapped
**Status:** ✅ Ready for safe refactoring