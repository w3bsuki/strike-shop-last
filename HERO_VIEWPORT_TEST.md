# Hero + Categories Viewport Test

## Layout Structure
```
Container: h-screen flex flex-col overflow-hidden
├── Hero Section: flex-grow (takes remaining space)
└── Category Bar: flex-shrink-0 (fixed height)
    ├── Mobile: h-20 (80px)
    └── Desktop: h-24 lg:h-28 (96px / 112px)
```

## Viewport Calculation
- **Total Height**: 100vh (viewport height)
- **Category Bar Height**: 
  - Mobile: 80px
  - Desktop: 96-112px
- **Hero Gets**: 100vh - category height

## Key Changes Made
1. **Container**: `h-screen flex flex-col overflow-hidden`
   - Ensures exactly viewport height
   - Flex column layout
   - No scrolling

2. **Hero Section**: `flex-grow`
   - Takes all available space
   - No fixed height calculations

3. **Category Bar**: `flex-shrink-0` with fixed heights
   - Mobile: `h-20` (80px)
   - Desktop: `h-24 lg:h-28` (96-112px)
   - Won't shrink, always visible

4. **Category Items**:
   - Mobile: Compact horizontal scroll
   - Desktop: Flex layout with equal widths

## Result
The categories are now GUARANTEED to be fully visible within the viewport because:
- Container is exactly viewport height
- Category bar has fixed height and won't shrink
- Hero takes remaining space
- No content can overflow