# Production-Ready Next.js Application Template

## 🚀 Multi-Agent Initialization Strategy

This template leverages our specialized agents for optimal setup:
- **@frontend**: UI components, styling, and client-side architecture
- **@backend**: API routes, database integration, and server-side logic  
- **@devops**: Docker configuration, CI/CD pipeline, and deployment
- **@testing**: Comprehensive testing setup and quality assurance
- **@docs**: Documentation, API specs, and developer guides

## 📋 Setup Checklist

### Phase 1: Core Application Setup (@frontend + @backend)
```bash
# 1. Initialize Next.js with optimal configuration
npx create-next-app@latest {{PROJECT_NAME}} \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint

cd {{PROJECT_NAME}}

# 2. Install production-grade dependencies
npm install \
  @tanstack/react-query \
  zustand \
  zod \
  react-hook-form \
  @hookform/resolvers \
  next-auth \
  @next-auth/prisma-adapter \
  prisma \
  @prisma/client \
  bcryptjs \
  jsonwebtoken \
  @types/bcryptjs \
  @types/jsonwebtoken

# 3. Install development dependencies
npm install -D \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  vitest \
  @vitejs/plugin-react \
  @playwright/test \
  eslint-plugin-testing-library \
  eslint-plugin-jest-dom \
  prisma \
  tsx
```

### Phase 2: Enhanced UI/UX Setup (@frontend)
```bash
# shadcn/ui setup for production-ready components
npx shadcn-ui@latest init

# Install essential shadcn components
npx shadcn-ui@latest add button input label card dialog sheet toast

# Additional UI libraries
npm install \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-tabs \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge

# Tailwind CSS plugins for enhanced styling
npm install -D \
  @tailwindcss/forms \
  @tailwindcss/typography \
  @tailwindcss/aspect-ratio \
  tailwindcss-animate
```

### Phase 3: Backend & Database Setup (@backend)
```bash
# Database setup with Prisma
npx prisma init

# Essential backend packages
npm install \
  @prisma/client \
  prisma \
  next-auth \
  @auth/prisma-adapter \
  nodemailer \
  @types/nodemailer \
  jose \
  @vercel/postgres \
  pg \
  @types/pg
```

### Phase 4: Testing Infrastructure (@testing)
```bash
# Testing setup
npm install -D \
  @playwright/test \
  vitest \
  @vitest/ui \
  jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  msw \
  axios \
  @types/node

# E2E testing setup
npx playwright install
```

### Phase 5: DevOps & Deployment (@devops)
```bash
# Docker and deployment tools
# (Docker files will be created by @devops agent)

# Monitoring and analytics
npm install \
  @vercel/analytics \
  @vercel/speed-insights
```

## 📁 Project Structure Template

```
{{PROJECT_NAME}}/
├── .env.local.example          # Environment variables template
├── .env.test                   # Test environment variables
├── .github/
│   └── workflows/
│       ├── ci.yml              # Continuous integration
│       ├── deploy.yml          # Deployment pipeline
│       └── security.yml        # Security scanning
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Protected routes
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/               # Authentication components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── forms/              # Form components
│   │   └── layout/             # Layout components
│   ├── lib/
│   │   ├── auth.ts             # Authentication configuration
│   │   ├── db.ts               # Database connection
│   │   ├── utils.ts            # Utility functions
│   │   ├── validations.ts      # Zod schemas
│   │   └── api-client.ts       # API client configuration
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand stores
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Additional styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding
├── tests/
│   ├── __mocks__/              # Test mocks
│   ├── setup.ts                # Test setup
│   ├── e2e/                    # Playwright E2E tests
│   └── utils/                  # Test utilities
├── docs/
│   ├── README.md               # Project documentation
│   ├── API.md                  # API documentation
│   └── DEPLOYMENT.md           # Deployment guide
├── docker-compose.yml          # Local development
├── Dockerfile                  # Production container
├── playwright.config.ts        # E2E test configuration  
├── vitest.config.ts            # Unit test configuration
├── tailwind.config.ts          # Tailwind configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## ⚙️ Configuration Files

### 1. Optimized Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https', 
        hostname: 'avatars.githubusercontent.com',
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### 2. Production-Ready Tailwind Configuration
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

### 3. Comprehensive Testing Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 4. Database Schema Template
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## 🔧 Agent Coordination Strategy

### Initialization Workflow
1. **Orchestrator Analysis**: Determine project requirements and complexity
2. **Parallel Agent Deployment**:
   - @frontend: UI setup, component library configuration
   - @backend: Database schema, API structure, authentication
   - @devops: Docker configuration, CI/CD pipeline setup
   - @testing: Test infrastructure and initial test suites
3. **Integration Phase**: Coordinate agent outputs into cohesive application
4. **Quality Assurance**: @testing agent validates entire setup
5. **Documentation**: @docs agent creates comprehensive project documentation

### Quality Gates
- [ ] TypeScript strict mode enabled with zero errors
- [ ] All components have accessibility attributes
- [ ] Database schema optimized with proper indexes
- [ ] API endpoints have request/response validation
- [ ] CI/CD pipeline configured with security scanning
- [ ] Test coverage >90% for critical components
- [ ] Performance benchmarks meet targets
- [ ] Security audit passes with no critical issues

---

**Usage**: This template provides a production-ready foundation that leverages all specialized agents for optimal development velocity and code quality. Each agent contributes their expertise while the orchestrator ensures cohesive integration.