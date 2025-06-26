# Component Architecture Guide

## Overview

This guide documents the component architecture patterns used in Strike Shop, following shadcn/ui best practices for building reusable, composable components.

## Core Principles

### 1. Component Composition
- **Small, focused components** that do one thing well
- **Composable primitives** that can be combined to create complex UIs
- **Separation of concerns** between presentation and logic

### 2. File Organization
```
components/
├── navigation/          # Navigation-related components
│   ├── site-header.tsx  # Main header composition
│   ├── navbar.tsx       # Desktop navigation
│   ├── mobile-nav.tsx   # Mobile navigation
│   ├── search-bar.tsx   # Search functionality
│   ├── user-nav.tsx     # User account navigation
│   └── index.ts         # Barrel export
├── ui/                  # shadcn/ui primitives
├── product/             # Product-related components
├── cart/                # Shopping cart components
└── common/              # Shared components
```

### 3. Component Patterns

#### Primitive Components (UI Layer)
```tsx
// Simple, reusable building blocks
<Button variant="ghost" size="icon">
  <Icon className="h-5 w-5" />
</Button>
```

#### Composed Components
```tsx
// Combine primitives to create feature components
export function SearchBar({ variant = "dialog" }) {
  // Combines Dialog, Input, Button primitives
}
```

#### Container Components
```tsx
// Handle data and state management
export function ProductListContainer() {
  const products = useProducts();
  return <ProductGrid products={products} />;
}
```

## Navigation Architecture

### Before (Monolithic)
```tsx
// 408 lines in one file
export default function Header() {
  // Newsletter logic
  // Navigation logic
  // Search logic
  // User account logic
  // Cart logic
  // Mobile menu logic
}
```

### After (Modular)
```tsx
// Composed from smaller components
export function SiteHeader() {
  return (
    <>
      <NewsletterBanner />
      <header>
        <MobileNav />
        <Logo />
        <NavBar />
        <SearchBar />
        <UserNav />
      </header>
    </>
  );
}
```

## Component Guidelines

### 1. Props Interface
```tsx
interface ComponentProps {
  // Always define props interface
  className?: string; // Allow style customization
  children?: React.ReactNode;
  variant?: "default" | "outline"; // Use discriminated unions
}
```

### 2. Styling with cn()
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-styles", // Base styles
  variant === "outline" && "variant-styles", // Conditional
  className // Allow overrides
)} />
```

### 3. Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation
- Provide screen reader hints

### 4. Configuration over Props
```tsx
// config/navigation.ts
export const mainNavItems: NavItem[] = [
  { title: "Sale", href: "/sale", badge: "HOT" },
  // ...
];

// Component uses config
import { mainNavItems } from "@/config/navigation";
```

## Refactoring Strategy

### Phase 1: Extract Components
1. Identify logical boundaries
2. Extract into separate files
3. Define clear props interfaces
4. Remove prop drilling

### Phase 2: Create Compositions
1. Build container components
2. Implement data fetching at container level
3. Keep presentational components pure

### Phase 3: Add Patterns
1. Create reusable hooks
2. Build higher-order components
3. Implement render props where needed

## Common Patterns

### 1. Trigger Pattern
```tsx
<MiniCart trigger={
  <Button variant="ghost">
    <ShoppingBag />
  </Button>
} />
```

### 2. Compound Components
```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger />
      <NavigationMenuContent />
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

### 3. Polymorphic Components
```tsx
const Component = React.forwardRef<
  HTMLElement,
  ComponentProps & { as?: React.ElementType }
>(({ as: Comp = "div", ...props }, ref) => {
  return <Comp ref={ref} {...props} />;
});
```

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock dependencies
- Focus on behavior, not implementation

### Integration Tests
- Test component compositions
- Verify data flow
- Check accessibility

### Visual Tests
- Snapshot testing for UI consistency
- Visual regression with Playwright

## Performance Considerations

### 1. Code Splitting
```tsx
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 2. Memoization
```tsx
const MemoizedComponent = React.memo(Component);

const expensiveValue = React.useMemo(
  () => computeExpensiveValue(a, b),
  [a, b]
);
```

### 3. Lazy Loading
```tsx
const LazyImage = ({ src, ...props }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useIntersectionObserver(() => setIsInView(true));
  
  return (
    <div ref={ref}>
      {isInView && <Image src={src} {...props} />}
    </div>
  );
};
```

## Migration Guide

### Step 1: Audit Current Components
- Identify monolithic components
- Find duplicate code
- Note accessibility issues

### Step 2: Plan Extraction
- Define component boundaries
- Create props interfaces
- Plan data flow

### Step 3: Implement Incrementally
- Extract one component at a time
- Maintain backward compatibility
- Add tests as you go

### Step 4: Update Imports
- Update all component imports
- Remove old components
- Update documentation

## Best Practices

1. **Keep components small** - If it's over 100 lines, consider splitting
2. **Use TypeScript** - Always define proper types
3. **Document props** - Use JSDoc comments for complex props
4. **Test accessibility** - Use axe-core and manual testing
5. **Optimize performance** - Lazy load when appropriate
6. **Follow naming conventions** - Be consistent and descriptive

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [React Patterns](https://reactpatterns.com)
- [Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)