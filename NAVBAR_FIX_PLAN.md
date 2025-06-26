# Strike Shop Navbar Fix Plan

## Problems Identified:
1. **Logo randomly placed** - conflicting `justify-center` vs `lg:justify-start` 
2. **Two mobile nav systems** - hamburger menu AND bottom nav (confusing)
3. **Flexbox competition** - logo and nav both using `flex-1`
4. **Inconsistent breakpoints** - mixed `lg:` usage
5. **Z-index conflicts** - multiple components same z-index

## Solution: Left-Logo Layout (Mobile + Desktop)

### Design Pattern:
```
[☰] STRIKE™         [Nav Menu]              [Search] [User]
Mobile

      STRIKE™       [Nav Menu]              [Search] [User]  
Desktop
```

## Implementation Steps:

### 1. Fix SiteHeader Layout
- Logo ALWAYS left-aligned (consistent on mobile/desktop)
- Remove hamburger menu (use bottom nav only on mobile)
- Clean flexbox layout without conflicts

### 2. Consolidate Mobile Navigation  
- Remove hamburger sidebar completely
- Use bottom navigation only
- Clean, simple mobile experience

### 3. Fix Component Architecture
- Consistent `lg:` breakpoints (1024px+)
- Proper z-index hierarchy
- Clean responsive behavior

## Target Result:
- Logo always on LEFT side (never random)
- Single mobile nav system (bottom bar)
- Clean, predictable layout
- Mobile perfect experience