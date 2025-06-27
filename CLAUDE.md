# Strike Shop 1 - AI Assistant Rules & Context

## 🚨 CRITICAL RULES - ALWAYS FOLLOW

1. **NEVER commit unless explicitly asked** - The user will tell you when to commit
2. **ALWAYS run these commands after making changes:**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```
3. **NEVER create new files unless absolutely necessary** - Always prefer editing existing files
4. **NEVER create documentation files (*.md) unless explicitly requested**
5. **ALWAYS use the existing UI components** from `components/ui/` - don't reinvent
6. **ALWAYS follow the existing code patterns** - check neighboring files first
7. **ALWAYS maintain TypeScript strict mode** - no `any` types, no `@ts-ignore`
8. **NEVER expose sensitive data** - check for API keys, secrets, passwords
9. **ALWAYS use absolute imports** starting with @ (e.g., `@/components/...`)
10. **NEVER modify database schemas** without explicit permission

## 📁 Project Overview

**Strike Shop** is a premium e-commerce platform with a typewriter/monospace aesthetic, built with:
- **Frontend**: Next.js 15 + TypeScript + TailwindCSS + Radix UI
- **Backend**: Medusa.js headless commerce
- **Database**: PostgreSQL + Redis
- **Auth**: Supabase (email/password + OAuth)
- **Payments**: Stripe

## 🏗️ Architecture Rules

### Frontend (Next.js)
- **App Router only** - No pages directory
- **Server Components by default** - Use `"use client"` only when needed
- **Parallel routes** for modals in `app/@modal/`
- **Dynamic segments** follow pattern: `[category]/[product]/page.tsx`
- **API routes** in `app/api/` - always validate input with Zod

### Component Rules
```typescript
// ALWAYS follow this structure:
// 1. Imports (grouped: react, next, external, internal, types)
// 2. Types/Interfaces
// 3. Component with proper TypeScript
// 4. Export

// Example:
import { FC } from 'react'
import { Button } from '@/components/ui/button'
import type { ProductProps } from '@/types'

interface ComponentProps {
  // ALWAYS define props interface
}

export const Component: FC<ComponentProps> = ({ prop }) => {
  // Implementation
}
```

### State Management
- **Zustand stores** in `lib/stores/` - always use TypeScript
- **React Query** for server state - use the existing queryClient
- **No Redux, MobX, or other state libraries**

### Styling Rules
1. **TailwindCSS only** - no CSS modules, styled-components
2. **Use design tokens**:
   ```tsx
   // Colors: border-strike-gray, bg-strike-dark, text-strike-white
   // Fonts: font-mono (Courier Prime)
   // Spacing: Use Tailwind defaults
   ```
3. **Responsive**: Mobile-first, use Tailwind breakpoints
4. **Dark mode**: Already configured, use dark: prefix

### Security Rules
1. **Input validation**: Always use Zod schemas
2. **API routes**: Check authentication with Supabase
3. **CSRF protection**: Already configured, don't disable
4. **Rate limiting**: Don't remove existing limits
5. **Sanitize user input**: Especially for dynamic routes

## 🛠️ Development Workflow

### Before Starting Any Task
```bash
# 1. Check current status
git status
git diff

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies if needed
npm install
```

### Making Changes
```bash
# 1. Always run dev server while working
npm run dev

# 2. After changes, run quality checks
npm run lint
npm run type-check
npm test

# 3. Fix any issues before proceeding
```

### Common Tasks

**Adding a new page:**
1. Create in `app/` directory following routing conventions
2. Use existing layout components
3. Implement loading.tsx and error.tsx
4. Add metadata for SEO

**Adding a component:**
1. Check if similar exists in `components/`
2. Use Radix UI primitives from `components/ui/`
3. Follow existing naming: PascalCase files, exports
4. Add proper TypeScript types

**Modifying API:**
1. Update both Next.js API route and Medusa endpoint
2. Update TypeScript types in `types/`
3. Update React Query hooks if needed
4. Test with Postman/curl

**Working with Medusa:**
```bash
cd my-medusa-store
npm run dev  # Runs on port 9000

# Database changes
medusa db:migrate
```

## 🔧 Key Commands

```bash
# Development
npm run dev          # Frontend on :4000
npm run dev:turbo   # With Turbopack
cd my-medusa-store && npm run dev  # Backend on :9000

# Quality Checks (RUN THESE ALWAYS)
npm run lint        # ESLint
npm run type-check  # TypeScript
npm test           # Jest tests
npm run test:e2e   # Playwright

# Build & Deploy
npm run build      # Production build
npm run analyze    # Bundle analysis

# Database
cd my-medusa-store
medusa db:migrate  # Run migrations
npm run seed       # Seed data
```

## 📋 Project Structure Quick Reference

```
app/
├── @modal/          → Parallel routes (product quickview, etc)
├── api/            → API routes (validate with Zod!)
├── auth/           → Clerk auth pages
├── admin/          → Admin dashboard
└── [category]/     → Dynamic product pages

components/
├── ui/             → Radix-based components (USE THESE!)
├── product/        → Product cards, grids, details
├── category/       → Category navigation
└── accessibility/  → A11y helpers (don't break!)

lib/
├── stores/         → Zustand stores
├── security/       → Security helpers
└── supabase/       → Supabase client

hooks/              → Custom React hooks
types/              → TypeScript definitions
```

## ⚠️ Common Pitfalls to Avoid

1. **Don't use pages/ directory** - We use app/ router
2. **Don't install new UI libraries** - Use Radix UI components
3. **Don't use CSS-in-JS** - Use TailwindCSS
4. **Don't skip type checking** - Fix TypeScript errors
5. **Don't hardcode values** - Use environment variables
6. **Don't create similar components** - Reuse existing ones
7. **Don't skip accessibility** - Keep ARIA labels, keyboard nav
8. **Don't remove security headers** - They're there for a reason
9. **Don't use relative imports** - Use @ alias
10. **Don't commit .env files** - Use .env.example

## 🚀 Performance Rules

1. Use `next/image` for all images
2. Lazy load components with `dynamic(() => import(...))`
3. Use React.memo sparingly and only when measured
4. Keep bundle size small - check with `npm run analyze`
5. Server Components by default - client only when needed

## 🧪 Testing Requirements

- Write tests for new utilities in `__tests__/`
- E2E tests for critical paths (auth, checkout)
- Component tests for complex interactions
- Always run tests before saying "done"

## 📝 Git Commit Convention

```bash
# Format: type(scope): message

feat(product): add quick view modal
fix(cart): resolve quantity update issue
style(ui): update button hover states
docs(readme): update setup instructions
test(auth): add login flow tests
refactor(api): simplify error handling
```

## 🔑 Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `STRIPE_SECRET_KEY` - Stripe payments
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` - Medusa API
- `REDIS_URL` - Redis cache (optional)

## 💡 Remember

1. The design is intentionally monospace/typewriter themed
2. We're building a premium experience - quality over speed
3. Accessibility is not optional - maintain WCAG 2.1 AA
4. Mobile experience is crucial - test responsive design
5. Performance matters - monitor Core Web Vitals

## 🆘 When Stuck

1. Check existing implementations first
2. Look at similar files in the codebase
3. Read the Medusa and Next.js documentation
4. Test in development before claiming completion
5. Ask for clarification rather than assuming

**MOST IMPORTANT**: Follow existing patterns, don't reinvent the wheel, and always run lint + type-check + tests!