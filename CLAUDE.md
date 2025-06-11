# CLAUDE - Autonomous Development Instructions

## 🚨 STRICT 5-FILE DOCUMENTATION WORKFLOW 🚨

### ONLY maintain these 5 .md files:
1. **STATUS.md** - Current project state and progress
2. **ISSUES.md** - All bugs, problems, and improvements  
3. **TODO.md** - Actionable tasks organized by priority
4. **TESTING.md** - Test strategy, status, and commands
5. **SECURITY.md** - Security status and checklist

### DO NOT CREATE ANY OTHER .md FILES!

### Workflow Process
1. **Audit** → Analyze code/features
2. **Document** → Update STATUS.md and ISSUES.md
3. **Plan** → Create tasks in TODO.md
4. **Execute** → Implement solutions
5. **Test** → Verify and update TESTING.md

## Commands to Run

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linting
npm run type-check   # TypeScript checking
```

### Testing
```bash
npm test            # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Proper interface definitions
- Export types from `types/` directory

### React/Next.js
- Use `"use client"` for client components
- Server components by default
- Proper error boundaries
- Loading states for async operations

### File Organization
- Components in `components/`
- Pages in `app/` (App Router)
- Types in `types/`
- Utils in `lib/`
- Hooks in `hooks/`

## Architecture Decisions

### State Management
- Zustand for client state (`lib/*-store.ts`)
- Server state via Next.js data fetching

### Styling
- Tailwind CSS
- shadcn/ui components
- Responsive design first

### Backend Integration
- Medusa e-commerce backend
- Sanity CMS for content
- API routes in `app/api/`

## Do's and Don'ts

### DO
- Always run tests after changes
- Check TypeScript errors before committing
- Follow existing component patterns
- Use existing UI components from `components/ui/`
- Maintain responsive design
- Handle loading and error states
- Update the 5 core .md files as needed

### DON'T
- Break existing functionality
- Ignore TypeScript errors
- Create new UI components without checking existing ones
- Skip testing critical paths
- Hardcode values that should be configurable
- Remove error handling
- Create additional .md files beyond the 5 core files

## Workflow Rules

### Before Making Changes
1. Check STATUS.md for current state
2. Review ISSUES.md for known problems
3. Check TODO.md for task priorities
4. Run tests to establish baseline

### After Making Changes
1. Run linting and type checking
2. Run relevant tests
3. Update STATUS.md with progress
4. Update TODO.md (mark completed/add new)
5. Document new issues in ISSUES.md
6. Update TESTING.md if tests added
7. Update SECURITY.md if security-related

## Critical Information

### Current State
- Medusa backend: v2.8.4 at http://172.30.205.219:9000
- Frontend: Next.js 14 at http://172.30.205.219:3004
- Authentication: Working with JWT
- Products: Displaying from Medusa
- Payment: Stripe pending setup

### Next Steps
1. Add product prices in Medusa admin
2. Configure Stripe payment
3. Complete cart/checkout flow
4. Fix mobile navigation
5. Add loading states