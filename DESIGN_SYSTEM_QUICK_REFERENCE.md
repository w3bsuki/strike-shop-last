# Strike Shop Design System - Quick Reference

## 🎯 Most Common Tokens

### Spacing (use these instead of arbitrary values)
```
p-1 (4px)    p-2 (8px)    p-3 (12px)   p-4 (16px)
p-5 (20px)   p-6 (24px)   p-8 (32px)   p-10 (40px)

gap-2 (8px)  gap-3 (12px) gap-4 (16px) gap-6 (24px)

m-0 (0)      m-2 (8px)    m-4 (16px)   m-6 (24px)
```

### Typography
```
text-xs      → Labels, captions (responsive 10-12px)
text-sm      → Body text, buttons (responsive 12-14px)
text-base    → Default body (responsive 14-16px)
text-lg      → Emphasized (responsive 16-18px)
text-xl      → Small headings (responsive 18-20px)
text-2xl     → Section headings (responsive 20-24px)
text-3xl     → Page headings (responsive 24-30px)
```

### Strike-specific
```
text-strike-xs   → UPPERCASE LABELS
text-strike-sm   → NAVIGATION, BUTTONS
text-strike-base → Product titles
```

### Colors
```
bg-strike-black       text-strike-black
bg-strike-white       text-strike-white
bg-strike-gray-100    text-strike-gray-600
border-strike-gray-200
border-strike-gray-300
```

### Buttons
```html
<!-- Primary -->
<button className="px-6 py-2.5 bg-strike-black text-strike-white text-strike-sm">
  BUTTON
</button>

<!-- Outline -->
<button className="px-6 py-2.5 border border-strike-black text-strike-black text-strike-sm">
  OUTLINE
</button>

<!-- Small -->
<button className="px-4 py-2 bg-strike-black text-strike-white text-xs">
  SMALL
</button>

<!-- Large -->
<button className="px-8 py-3 bg-strike-black text-strike-white text-strike-base">
  LARGE
</button>
```

### Input Fields
```html
<input 
  className="w-full px-3 py-2 border border-strike-gray-300 text-base focus:outline-none focus:border-strike-black"
  placeholder="Enter text"
/>
```

### Cards
```html
<div className="p-4 border border-strike-gray-200 space-y-3">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-sm text-strike-gray-600">Card content</p>
</div>
```

## ❌ Don't Use
```
❌ p-[17px]      ✅ p-4
❌ gap-[13px]    ✅ gap-3
❌ text-[14px]   ✅ text-sm
❌ rounded-md    ✅ rounded-none
❌ space-x-4     ✅ gap-4
```

## 📱 Mobile Requirements
- All buttons/inputs: `min-h-[44px]` (minimum)
- Comfortable touch: `min-h-[48px]` (preferred)
- Use `gap` instead of `space-x/y` for better mobile layout

## 🚀 TypeScript Import
```typescript
import { spacing, typography, colors } from '@/lib/design-tokens';
```

## 🔍 Find Issues
```bash
node scripts/find-arbitrary-values.js
```