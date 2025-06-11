# TESTING - Test Strategy & Status

## Test Commands

### Primary Commands
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Specific Test Types
```bash
# Component tests
npm test -- --testPathPattern=components

# API tests  
npm test -- --testPathPattern=api

# Integration tests
npm test -- --testPathPattern=integration
```

## Test Strategy

### Testing Pyramid
1. **Unit Tests** (70%) - Individual functions and components
2. **Integration Tests** (20%) - Component interactions and API flows
3. **E2E Tests** (10%) - Critical user journeys

### What to Test

#### High Priority (Must Have Tests)
- 🔥 Authentication flow
- 🔥 Shopping cart operations
- 🔥 Checkout process
- 🔥 Payment handling
- 🔥 Order management
- 🔥 Admin product management

#### Medium Priority (Should Have Tests)
- 📋 Product filtering and search
- 📋 User profile management
- 📋 Wishlist functionality
- 📋 Review system
- 📋 Navigation components

#### Low Priority (Nice to Have Tests)
- 🔄 UI component variations
- 🔄 Responsive layout
- 🔄 Theme switching
- 🔄 Animation states

## Test Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 29.99
  }

  it('displays product information', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('handles add to cart click', () => {
    const onAddToCart = jest.fn()
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />)
    
    fireEvent.click(screen.getByText('Add to Cart'))
    expect(onAddToCart).toHaveBeenCalledWith('1')
  })
})
```

### API Testing
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('/api/products', () => {
  it('returns products list', async () => {
    const request = new NextRequest('http://localhost:3000/api/products')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data.products)).toBe(true)
  })
})
```

### Store Testing
```typescript
import { useCartStore } from '@/lib/cart-store'

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('adds item to cart', () => {
    const { addItem } = useCartStore.getState()
    
    addItem({ id: '1', name: 'Test', price: 10 })
    
    expect(useCartStore.getState().items.length).toBe(1)
  })
})
```

## Test Configuration

### Jest Setup
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
}
```

### Coverage Goals
- **Overall**: 80%+
- **Critical paths**: 95%+
- **Components**: 70%+
- **Utilities**: 90%+

## Test Status

### Current Coverage
- Overall: 0% (No tests implemented yet)
- Components: 0%
- API Routes: 0%
- Utilities: 0%

### Test Health
- Last test run: No tests exist
- Failing tests: N/A
- Test setup: Not configured
- Test framework: Not installed

## Testing Checklist

### Before Committing
- [ ] All tests pass
- [ ] New code has tests
- [ ] Coverage hasn't decreased significantly
- [ ] No test warnings or errors

### Before Deploying
- [ ] Full test suite passes
- [ ] Integration tests pass
- [ ] Critical path tests pass
- [ ] Performance tests acceptable

## Common Test Scenarios

### E-commerce Specific Tests
```typescript
// Cart functionality
describe('Shopping Cart', () => {
  it('calculates total correctly with tax')
  it('applies discount codes')
  it('handles quantity updates')
  it('persists across sessions')
})

// Checkout flow
describe('Checkout Process', () => {
  it('validates shipping information')
  it('processes payment successfully')
  it('handles payment failures')
  it('creates order record')
})

// Admin functions
describe('Admin Panel', () => {
  it('requires authentication')
  it('allows product creation')
  it('updates inventory correctly')
  it('processes orders')
})
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Test Data Management

### Mock Data
- Create reusable mock objects
- Use factories for complex data
- Keep mocks simple and focused

### Test Database
- Use in-memory database for tests
- Reset state between tests
- Seed with consistent test data

## Performance Testing

### Load Testing
- API endpoint performance
- Database query optimization
- Frontend rendering performance

### Metrics to Track
- Response times
- Memory usage
- Bundle size impact
- Rendering performance

## Debugging Tests

### Common Issues
- Async operations not awaited
- State not reset between tests
- Mock functions not cleared
- DOM not properly cleaned up

### Debug Commands
```bash
npm test -- --verbose          # Detailed output
npm test -- --detectOpenHandles # Find hanging processes
npm test -- --no-cache         # Clear Jest cache
```

## Continuous Integration

### Pre-commit Hooks
- Run relevant tests
- Check coverage thresholds
- Lint test files

### CI Pipeline
- Run full test suite
- Generate coverage reports
- Fail on coverage decrease
- Performance regression testing

Last Updated: Creation date