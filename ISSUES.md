# ISSUES - Strike Shop Project

## Critical Issues 🔴
None currently - Medusa backend authentication fixed

## High Priority Issues 🟡
### Frontend
- [ ] Products need prices added in Medusa backend
- [ ] Product detail pages not yet connected to Medusa
- [ ] Cart functionality needs Medusa integration
- [ ] Checkout flow needs Stripe integration

### Backend
- [ ] Need to migrate from SQLite to PostgreSQL for production
- [ ] Redis not configured for caching
- [ ] Email service not set up for transactional emails

## Medium Priority Issues 🟢
### UI/UX (Production Blockers)
- [ ] No loading skeletons for product data fetching
- [ ] Plain text "Product not found" instead of proper 404 page
- [ ] Auth errors only logged to console, no user feedback
- [ ] No error messages for failed login/registration
- [ ] Missing ARIA labels on interactive elements
- [ ] Modals don't trap focus properly
- [ ] Touch targets too small for mobile (<44px)
- [ ] No keyboard navigation support
- [ ] Horizontal scroll difficult on mobile
- [ ] Mobile menu animation feels sluggish
- [ ] Form layouts not optimized for mobile keyboards
- [ ] No real-time validation in checkout form
- [ ] Required fields not clearly marked
- [ ] No format hints or masks for inputs
- [ ] No password strength indicators
- [ ] "Added to cart" feedback disappears too quickly (1.5s)
- [ ] No feedback when adding to wishlist
- [ ] No animation when cart items added/removed
- [ ] No breadcrumbs on product pages
- [ ] Search functionality not implemented
- [ ] Filter/sort options on category pages missing

### Performance
- [ ] Images not optimized (need proper srcset)
- [ ] No lazy loading on product grids
- [ ] Bundle size can be reduced

## Low Priority Issues ⚪
- [ ] Social media links are placeholders
- [ ] Newsletter signup not functional
- [ ] Community section needs real content
- [ ] Size guide data is hardcoded

## Fixed Issues ✅
- [x] Medusa backend authentication failing
- [x] CORS issues with WSL environment
- [x] Next.js image configuration for Medusa S3
- [x] Frontend fetching from Medusa successfully