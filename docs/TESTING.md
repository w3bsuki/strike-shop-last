# Testing Guide

## Overview

This project uses Jest and React Testing Library for testing React components and TypeScript code. We follow a comprehensive testing strategy with different test types for different purposes.

## Test Types

### 1. Unit Tests
- **Location**: `lib/**/*.test.ts`, `utils/**/*.test.ts`
- **Purpose**: Test individual functions and utilities in isolation
- **Coverage Target**: 80%
- **Run**: `npm run test:unit`

### 2. Component Tests
- **Location**: `components/**/*.test.tsx`
- **Purpose**: Test React components with user interactions
- **Coverage Target**: 70%
- **Run**: `npm run test:component`

### 3. Integration Tests
- **Location**: `__tests__/integration/**/*.test.ts`
- **Purpose**: Test API routes and service integrations
- **Coverage Target**: 60%
- **Run**: `npm run test:integration`

### 4. Domain Tests
- **Location**: `app/**/*.test.tsx`
- **Purpose**: Test page components and domain logic
- **Coverage Target**: 75%
- **Run**: `npm run test:domain`

### 5. E2E Tests
- **Location**: `tests/**/*.spec.ts`
- **Purpose**: Test full user workflows
- **Run**: `npm run test:e2e`

## Writing Tests

### Component Testing Example

```tsx
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils';
import { ProductCard } from './product-card';
import { mockProduct } from '@/__tests__/utils/mock-data';

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText('€100.00')).toBeInTheDocument();
  });

  it('adds product to cart on button click', async () => {
    render(<ProductCard product={mockProduct} />);
    
    const addButton = screen.getByText('Add to Cart');
    fireEvent.click(addButton);
    
    // Assert cart action was called
  });
});
```

### Service Testing Example

```ts
import { shopifyClient } from './shopify';
import { mockFetchResponse } from '@/__tests__/utils/mock-data';

jest.mock('global.fetch');

describe('Shopify Service', () => {
  it('fetches products with currency', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      mockFetchResponse({ data: { products: [] } })
    );

    const products = await shopifyClient.getProducts('EUR');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('graphql'),
      expect.objectContaining({
        body: expect.stringContaining('EUR'),
      })
    );
  });
});
```

## Test Utilities

### Custom Render
Our custom render function includes all necessary providers:

```tsx
import { render } from '@/__tests__/utils/test-utils';

// Renders with all providers
render(<Component />, {
  locale: 'bg',
  currency: 'BGN',
});
```

### Mock Data
Use centralized mock data for consistency:

```tsx
import { 
  mockProduct, 
  mockCartItem, 
  mockUser 
} from '@/__tests__/utils/mock-data';
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test type
npm run test:unit
npm run test:component
npm run test:integration

# Run tests for CI
npm run test:ci
```

## Coverage Requirements

- **Overall**: 50% minimum
- **Unit Tests**: 80% for utilities and services
- **Component Tests**: 70% for UI components
- **Integration Tests**: 60% for API routes
- **Domain Tests**: 75% for page components

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state

2. **Use Testing Library Queries**
   ```tsx
   // Good
   screen.getByRole('button', { name: /add to cart/i });
   
   // Avoid
   screen.getByTestId('add-button');
   ```

3. **Mock External Dependencies**
   ```tsx
   jest.mock('@/lib/store');
   jest.mock('next/navigation');
   ```

4. **Test Accessibility**
   ```tsx
   expect(button).toHaveAccessibleName('Add to Cart');
   expect(form).toBeAccessible();
   ```

5. **Test Error States**
   ```tsx
   it('handles network errors gracefully', async () => {
     global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
     // Test error handling
   });
   ```

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- product-card.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="adds to cart"

# Debug in VS Code
# Add breakpoint and use Jest Runner extension
```

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Pre-commit hooks (via husky)

GitHub Actions workflow:
- Runs all test suites
- Generates coverage reports
- Comments coverage on PRs
- Fails if coverage drops below thresholds