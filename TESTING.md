# 🧪 Strike Shop - Testing Strategy & Guidelines

## Overview

This document outlines the comprehensive testing strategy for Strike Shop, implementing enterprise-grade quality assurance with **90%+ code coverage** target and a complete testing pyramid approach.

## 🎯 Testing Philosophy

### Quality Standards
- **90%+ Code Coverage** across all test suites
- **Testing Pyramid**: 70% Unit/Domain, 20% Integration, 10% E2E
- **WCAG 2.1 AA** accessibility compliance
- **Core Web Vitals** performance standards
- **Visual regression** prevention
- **Security testing** for all critical paths

### Test-Driven Development (TDD)
1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while maintaining tests

## 🏗️ Testing Architecture

### Test Pyramid Structure

```
           🎭 E2E Tests (10%)
          ┌─────────────────────┐
          │ Critical Journeys   │
          │ Performance         │
          │ Accessibility       │
          │ Visual Regression   │
          └─────────────────────┘
        
      🔗 Integration Tests (20%)
    ┌───────────────────────────────┐
    │ API Endpoints                 │
    │ Database Operations           │
    │ External Service Integration  │
    └───────────────────────────────┘

  🧩 Unit & Component Tests (70%)
┌─────────────────────────────────────────┐
│ Domain Entities & Value Objects (40%)   │
│ React Components (20%)                  │
│ Utilities & Services (10%)              │
└─────────────────────────────────────────┘
```

## 🔧 Test Configuration

### Jest Configurations
- **`jest.config.domain.js`**: Domain layer tests (95% coverage target)
- **`jest.config.unit.js`**: Utility and service tests (85% coverage)
- **`jest.config.component.js`**: React component tests (80% coverage)
- **`jest.config.integration.js`**: API integration tests (75% coverage)

### Playwright Configuration
- **Cross-browser**: Chromium, Firefox, WebKit
- **Mobile testing**: iOS Safari, Android Chrome
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals monitoring
- **Visual regression**: Screenshot comparison

## 📝 Test Commands

### Development
```bash
# Run specific test suites
npm run test:domain        # Domain entity tests
npm run test:unit          # Unit tests
npm run test:component     # Component tests
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests

# Watch mode for active development
npm run test:watch:unit
npm run test:watch:component

# Debug tests
npm run test:debug
```

### Quality Assurance
```bash
# Comprehensive test runner with coverage
npm run test:quality-gates

# Individual quality checks
npm run test:accessibility
npm run test:performance
npm run test:visual

# Coverage analysis
npm run test:coverage:all
```

### CI/CD
```bash
# Complete test suite for CI
npm run test:all

# Quality gates check
npm run test:quality-gates
```

## 🎯 Testing Guidelines

### 1. Domain Layer Testing (40% of coverage)

#### Value Objects
```typescript
// tests/domain/value-objects/money.test.ts
describe('Money Value Object', () => {
  it('should create valid money instance', () => {
    const money = Money.fromDecimal(99.99, Currency.USD);
    expect(money.amount).toBe(9999);
    expect(money.currency).toBe(Currency.USD);
  });

  it('should enforce business rules', () => {
    expect(() => Money.fromDecimal(-10, Currency.USD))
      .toThrow(BusinessRuleViolationError);
  });
});
```

#### Entities & Aggregates
```typescript
// tests/domain/cart/entities/cart.test.ts
describe('Cart Aggregate', () => {
  it('should add items within quantity limits', () => {
    const cart = Cart.create(cartId);
    cart.addItem(productId, variantId, 'Product', 'Variant', 'SKU', 2, price);
    
    expect(cart.items).toHaveLength(1);
    expect(cart.totalQuantity).toBe(2);
  });

  it('should emit domain events', () => {
    const cart = Cart.create(cartId);
    cart.addItem(productId, variantId, 'Product', 'Variant', 'SKU', 1, price);
    
    expect(cart.domainEvents).toContainEqual(
      expect.objectContaining({ type: 'ItemAddedToCart' })
    );
  });
});
```

### 2. Component Testing (20% of coverage)

#### React Testing Library Best Practices
```typescript
// tests/component/product/ProductCard.test.tsx
describe('ProductCard', () => {
  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', expect.stringContaining(mockProduct.title));
  });

  it('should handle add to cart interaction', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={mockProduct} />);
    
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    
    expect(mockCartActions.addItem).toHaveBeenCalledWith(mockProduct.id);
    expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
  });

  it('should be accessible', async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
```

### 3. Integration Testing (20% of coverage)

#### API Endpoint Testing
```typescript
// tests/integration/api/products.test.ts
describe('Products API', () => {
  it('should return paginated products', async () => {
    const request = new NextRequest('http://localhost:3000/api/products?page=1&limit=20');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(20);
    expect(data.pagination.page).toBe(1);
  });

  it('should handle validation errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/products?page=0');
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });
});
```

### 4. E2E Testing (10% of coverage)

#### Critical User Journeys
```typescript
// tests/e2e/critical-journeys/complete-purchase.spec.ts
test('user can complete full purchase journey', async ({ page }) => {
  // 1. Browse products
  await page.goto('/');
  await page.click('[data-testid="product-card"]');

  // 2. Add to cart
  await page.click('[data-testid="add-to-cart"]');

  // 3. Checkout
  await page.click('[data-testid="cart-icon"]');
  await page.click('[data-testid="checkout-button"]');

  // 4. Fill shipping information
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  // ... more form fields

  // 5. Complete payment
  await page.click('[data-testid="complete-order"]');

  // 6. Verify success
  await expect(page).toHaveURL(/order-confirmation/);
  await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
});
```

## 🎨 Page Object Model

### Structure
```typescript
// tests/e2e/page-objects/product.page.ts
export class ProductPage {
  constructor(private page: Page) {}

  async goto(productHandle: string) {
    await this.page.goto(`/products/${productHandle}`);
  }

  async addToCart() {
    await this.page.click('[data-testid="add-to-cart"]');
    await expect(this.page.locator('[data-testid="cart-notification"]')).toBeVisible();
  }

  async verifyProductDetails() {
    await expect(this.page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="product-price"]')).toBeVisible();
  }
}
```

## ♿ Accessibility Testing

### WCAG 2.1 AA Compliance
```typescript
// tests/e2e/accessibility/a11y-compliance.spec.ts
test('homepage meets WCAG standards', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Keyboard Navigation
```typescript
test('all interactive elements are keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  const focusableElements = await page.locator(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ).all();

  for (const element of focusableElements) {
    await element.focus();
    await expect(element).toBeFocused();
  }
});
```

## 🚀 Performance Testing

### Core Web Vitals
```typescript
// tests/e2e/performance/core-web-vitals.spec.ts
test('homepage meets Core Web Vitals thresholds', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  
  const metrics = await page.evaluate(() => {
    // Measure LCP, FID, CLS, TTFB
    return new Promise((resolve) => {
      // Performance measurement logic
    });
  });

  expect(metrics.lcp).toBeLessThan(2500); // Good LCP < 2.5s
  expect(metrics.fid).toBeLessThan(100);  // Good FID < 100ms
  expect(metrics.cls).toBeLessThan(0.1);  // Good CLS < 0.1
});
```

## 👁️ Visual Regression Testing

### Screenshot Comparison
```typescript
// tests/e2e/visual/ui-consistency.spec.ts
test('homepage visual consistency', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Hide dynamic content
  await page.addStyleTag({
    content: `[data-testid="current-time"] { visibility: hidden !important; }`
  });
  
  await expect(page).toHaveScreenshot('homepage.png');
});
```

## 📊 Coverage Requirements

### Target Coverage by Layer
- **Domain Layer**: 95%+ (Critical business logic)
- **Unit Tests**: 85%+ (Utilities and services)
- **Component Tests**: 80%+ (UI components)
- **Integration Tests**: 75%+ (API endpoints)
- **Overall Target**: 90%+

### Coverage Commands
```bash
# Generate coverage reports
npm run test:coverage:all

# View coverage in browser
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:quality-gates
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
- **Unit Tests**: Run on every push/PR
- **Integration Tests**: Run on main/develop branches
- **E2E Tests**: Run on release candidates
- **Quality Gates**: Enforce 90% coverage
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals monitoring
- **Security**: Dependency vulnerability scanning

### Quality Gates Checklist
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E critical journeys pass
- [ ] 90%+ code coverage achieved
- [ ] No accessibility violations
- [ ] Performance benchmarks met
- [ ] No security vulnerabilities
- [ ] Visual regressions checked

## 🛠️ Tools & Technologies

### Testing Frameworks
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **Axe Core**: Accessibility testing
- **MSW**: API mocking

### Quality Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks
- **SonarCloud**: Code quality analysis

## 🎯 Best Practices

### Test Structure
1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the code under test
3. **Assert**: Verify the expected outcomes

### Naming Conventions
```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do expected behavior', () => {
      // Test implementation
    });
  });
});
```

### Test Data Management
- Use factories for consistent test data
- Mock external dependencies
- Isolate tests from each other
- Clean up after tests

### Performance Tips
- Run tests in parallel when possible
- Use `beforeAll` for expensive setup
- Mock heavy operations
- Optimize test database queries

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Training Materials
- [Testing JavaScript Course](https://testingjavascript.com/)
- [Accessibility Testing Guide](https://web.dev/accessibility-testing/)
- [Performance Testing Best Practices](https://web.dev/performance-testing/)

---

## 🎉 Conclusion

This testing strategy ensures **Strike Shop** maintains enterprise-grade quality with comprehensive coverage, automated quality gates, and continuous monitoring. The 90%+ coverage target, combined with accessibility compliance and performance monitoring, provides confidence in the application's reliability and user experience.

**Remember**: Tests are not just about coverage numbers—they're about building confidence in our code and ensuring a great user experience! 🚀