# Strike Shop - Modern E-commerce Platform

A production-ready e-commerce application built with Next.js 14, Medusa.js, and Sanity CMS.

## 🚀 Quick Start

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

```bash
# 1. Clone and install
git clone <your-repo>
cd strike-shop
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Sanity project ID

# 3. Run frontend
npm run dev

# 4. Run Medusa backend (in another terminal)
cd my-medusa-store
pnpm install
pnpm run dev
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Medusa.js for e-commerce operations
- **CMS**: Sanity for content management
- **Database**: PostgreSQL
- **UI**: shadcn/ui components
- **State**: Zustand for client state management

## 🔧 Features

### ✅ Production Ready
- Complete e-commerce cart and checkout flow
- Secure authentication with session management
- Real-time inventory and pricing via Medusa
- Content management via Sanity Studio
- Mobile-first responsive design
- Error boundaries and comprehensive error handling

### 🛡️ Security Features
- XSS and CSRF protection
- Rate limiting on authentication
- Secure token storage with encryption
- Input validation and sanitization
- SQL injection prevention

### 📱 User Experience
- Fast product search and filtering
- Persistent shopping cart
- Guest and authenticated checkout
- Order tracking and history
- Wishlist functionality

## 📁 Project Structure

```
strike-shop/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── error-boundary.tsx # Error handling
├── lib/                   # Utilities and services
│   ├── medusa.ts         # Medusa client
│   ├── sanity.ts         # Sanity client
│   ├── data-service.ts   # Data integration
│   └── *-store.ts        # Zustand stores
├── my-medusa-store/       # Medusa backend
├── sanity/               # Sanity configuration
├── scripts/              # Setup and seed scripts
└── docs/                 # Documentation
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Deploy to Vercel
npm run build
vercel --prod
```

### Backend (Railway/Heroku)
```bash
cd my-medusa-store
# Set environment variables
npm run build
npm start
```

## 📚 Documentation

- [Quick Start Guide](./QUICK_START.md) - Get up and running
- [Integration Guide](./INTEGRATION_GUIDE.md) - Sanity + Medusa setup
- [Production Setup](./PRODUCTION_SETUP.md) - Deploy to production
- [Security Guide](./SECURITY.md) - Security implementation

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL
- Sanity account

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

#### Backend (my-medusa-store/.env)
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa_db
STORE_CORS=http://localhost:3000
JWT_SECRET=your-secret
COOKIE_SECRET=your-secret
```

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

#### Backend
```bash
pnpm run dev         # Start Medusa server
pnpm run build       # Build Medusa
npx medusa db:migrate # Run database migrations
npx medusa seed      # Seed sample data
```

## 🔌 API Integration

### Sanity Queries
```typescript
// Get products
const products = await client.fetch(`
  *[_type == "product"]{
    name, price, "slug": slug.current,
    "image": images[0].asset->url
  }
`)
```

### Medusa Operations
```typescript
// Add to cart
await medusaClient.carts.lineItems.create(cartId, {
  variant_id: variantId,
  quantity: 1
})
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- Documentation: Check the guides in `/docs`
- Issues: Open a GitHub issue
- Community: Join our Discord

---

Built with ❤️ using modern web technologies.