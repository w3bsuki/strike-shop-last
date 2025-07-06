# STRIKE DESIGN SYSTEM 2025
## Youthful Streetwear E-commerce Platform

### 🎯 Design Philosophy
Strike represents the intersection of high-fashion streetwear and accessible youth culture. Inspired by Off-White's aesthetic but with our own unique voice: bold, minimalist, and unapologetically youthful.

**Core Principles:**
1. **Bold Minimalism** - Less is more, but make it loud
2. **Contrast-First** - Black and white with strategic color pops
3. **Typography as Art** - Text is design, not just content
4. **Mobile-First Luxury** - Premium experience on any device
5. **Motion with Purpose** - Subtle animations that enhance, not distract

---

## 📱 MOBILE-FIRST LAYOUT SYSTEM

### Hero/Carousel Section
```
Mobile (375px - 768px):
┌─────────────────────────┐
│  STRIKE™ MARQUEE (24px) │ ← Scrolling announcements
├─────────────────────────┤
│                         │
│    HERO IMAGE/VIDEO     │ ← Full-width, 80vh height
│                         │
│  ┌───────────────────┐  │
│  │   NEW COLLECTION   │  │ ← Badge (top-left)
│  │                   │  │
│  │    STRIKE SS25    │  │ ← Bold title (48px)
│  │                   │  │
│  │  [SHOP NOW]       │  │ ← CTA (full-width)
│  └───────────────────┘  │
├─────────────────────────┤
│  CATEGORY CAROUSEL      │ ← Swipeable categories
│  [CAT1][CAT2][CAT3]→   │
└─────────────────────────┘

Desktop (1024px+):
┌─────────────────────────────────────────────┐
│        STRIKE™ MARQUEE (32px)               │
├─────────────────────────────────────────────┤
│                                             │
│          HERO IMAGE/VIDEO CAROUSEL          │ ← Multi-slide
│                                             │
│    ┌─────────────────────────────────┐     │
│    │  NEW COLLECTION                  │     │
│    │                                  │     │
│    │      STRIKE SS25                 │     │ ← 96px title
│    │  GRAY AREA BETWEEN B&W          │     │
│    │                                  │     │
│    │  [SHOP COLLECTION] [LOOKBOOK]   │     │ ← Multiple CTAs
│    └─────────────────────────────────┘     │
│                                             │
│    ○ ● ○ ○                                 │ ← Slide indicators
├─────────────────────────────────────────────┤
│            CATEGORY SHOWCASE                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ NEW  │ │STREET│ │ SALE │ │ACCESS│     │
│  │ 125  │ │ 89   │ │ 45   │ │ 67   │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
└─────────────────────────────────────────────┘
```

### Product Grid Layout
```
Mobile: 2 columns, 16px gap
Desktop: 4 columns, 24px gap

Product Card Structure:
┌─────────────┐
│   [IMAGE]   │ ← Hover: quick actions
│ ♡  👁  🛒   │ ← Wishlist/View/Cart
├─────────────┤
│ PRODUCT NAME│ ← Bold, uppercase
│ $129.00     │ ← Price (red if sale)
│ ●●○○        │ ← Color options
└─────────────┘
```

---

## 🎨 COLOR SYSTEM

### Primary Palette
```css
/* Core Brand Colors */
--strike-black: #000000;        /* Primary text, backgrounds */
--strike-white: #FFFFFF;        /* Primary backgrounds, text */
--strike-gray: #7F7F7F;         /* Secondary text */
--strike-light-gray: #F5F5F5;   /* Backgrounds, cards */

/* Accent Colors - Use Sparingly */
--strike-red: #FF0000;          /* CTAs, sale badges, errors */
--strike-green: #00FF00;        /* Success states only */
--strike-blue: #0000FF;         /* Links, info states */

/* Gradient System */
--strike-gradient-primary: linear-gradient(135deg, #000 0%, #333 100%);
--strike-gradient-hover: linear-gradient(135deg, #333 0%, #000 100%);
```

### Usage Rules
1. **90% Black & White** - Maintain high contrast
2. **8% Gray** - For secondary elements
3. **2% Color** - Strategic accent usage only
4. **NO PASTELS** - Bold colors only

---

## 🔤 TYPOGRAPHY SYSTEM

### Font Stack
```css
/* Primary Font - Sans Serif */
font-family: 'Helvetica Neue', Arial, sans-serif;

/* Display Font - For hero text */
font-family: 'Arial Black', 'Helvetica Neue', sans-serif;

/* Monospace - For prices, SKUs */
font-family: 'SF Mono', 'Monaco', monospace;
```

### Type Scale
```css
/* Mobile Type Scale */
--text-xs: 10px;      /* Legal, badges */
--text-sm: 12px;      /* Secondary info */
--text-base: 14px;    /* Body text */
--text-lg: 16px;      /* Subheadings */
--text-xl: 20px;      /* Section titles */
--text-2xl: 28px;     /* Page titles */
--text-3xl: 36px;     /* Hero mobile */
--text-4xl: 48px;     /* Hero title */

/* Desktop Type Scale */
@media (min-width: 1024px) {
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 24px;
  --text-2xl: 36px;
  --text-3xl: 48px;
  --text-4xl: 64px;
  --text-5xl: 96px;   /* Hero desktop */
}
```

### Typography Rules
1. **UPPERCASE for headers** - All section titles
2. **Sentence case for body** - Readable content
3. **Bold = Important** - Prices, CTAs, product names
4. **Letter-spacing** - 0.05em for uppercase text
5. **Line height** - 1.2 for headers, 1.5 for body

---

## 🎭 COMPONENT DESIGN

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--strike-black);
  color: var(--strike-white);
  padding: 16px 32px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--strike-white);
  color: var(--strike-black);
  border-color: var(--strike-black);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--strike-black);
  border: 2px solid var(--strike-black);
}

/* Mobile: Full-width buttons */
@media (max-width: 768px) {
  .btn { width: 100%; }
}
```

### Cards
```css
.product-card {
  background: var(--strike-white);
  border: 1px solid var(--strike-light-gray);
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
```

### Form Elements
```css
.input {
  background: var(--strike-white);
  border: 2px solid var(--strike-black);
  padding: 12px 16px;
  font-size: 16px; /* Prevent zoom on iOS */
}

.input:focus {
  outline: none;
  border-color: var(--strike-red);
}
```

---

## 📐 BALANCED DESIGN SYSTEM - Sharp vs Rounded

### Design Philosophy
Our design system uses a **strategic balance** between sharp and rounded corners based on element purpose:

**SHARP (0 radius) - Content & Structure**
- ✓ Product cards - Maximizes image space
- ✓ Category cards - Creates clean grid
- ✓ Navigation bars - Professional header
- ✓ Page sections - Clean content blocks
- ✓ Image containers - No wasted corners

**ROUNDED (8-12px) - Interactive Elements**
- ✓ All buttons/CTAs - Higher conversion (+15% CTR)
- ✓ Form inputs - Modern, approachable
- ✓ Modals/dialogs - Softer overlay feel
- ✓ Dropdown menus - Touch-friendly
- ✓ Interactive cards - When clickable

**PILLS (full radius) - Special Elements**
- ✓ Badges (NEW, SALE) - Eye-catching
- ✓ Tags/chips - Compact info
- ✓ User avatars - Standard pattern
- ✓ Toggle switches - Clear on/off

### Implementation Guide
```css
/* Content - Sharp */
.product-card { border-radius: 0; }
.category-card { border-radius: 0; }
.hero-section { border-radius: 0; }

/* Interactive - Rounded */
.btn-primary { border-radius: 8px; } /* var(--radius-lg) */
.input { border-radius: 6px; } /* var(--radius-md) */
.modal { border-radius: 8px; } /* var(--radius-lg) */

/* Special - Pills */
.badge { border-radius: 9999px; } /* var(--radius-full) */
.avatar { border-radius: 50%; }
```

### Mobile Adjustments
On mobile devices, we slightly increase rounding for better touch experience:
```css
@media (max-width: 768px) {
  .btn-primary { border-radius: 10px; }
  .input { border-radius: 8px; }
}
```

---

## 🎬 MOTION & INTERACTIONS

### Animation Principles
1. **Duration**: 200-300ms for micro, 500-800ms for macro
2. **Easing**: ease-out for entrances, ease-in for exits
3. **Purpose**: Every animation must improve UX

### Standard Animations
```css
/* Page Transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hover States */
.hover-lift {
  transition: transform 0.3s ease-out;
}
.hover-lift:hover {
  transform: translateY(-4px);
}

/* Loading States */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}
```

---

## 📏 SPACING SYSTEM

### Base Unit: 8px
```css
--space-0: 0;
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
--space-8: 64px;
--space-10: 80px;
--space-12: 96px;
```

### Mobile Spacing Rules
- **Padding**: 16px horizontal on all containers
- **Margins**: 24px between sections
- **Gaps**: 16px in grids

### Desktop Spacing Rules
- **Padding**: 40px horizontal on containers
- **Margins**: 48px between sections  
- **Gaps**: 24px in grids

---

## 🛍️ E-COMMERCE SPECIFIC

### Product Display Rules
1. **Image First** - 4:5 aspect ratio, lazy loaded
2. **Quick Actions** - Appear on hover/touch
3. **Price Hierarchy** - Original crossed, sale price red
4. **Variant Dots** - Max 4 visible, +X for more
5. **Badge Position** - Top-left, overlapping image

### Cart/Checkout Design
```
Mobile Cart Drawer:
┌─────────────────────────┐
│ CART (2)           [X]  │
├─────────────────────────┤
│ ┌─────┬───────────────┐ │
│ │[IMG]│ PRODUCT NAME  │ │
│ │     │ Size: M       │ │
│ │     │ $129 [-][1][+]│ │
│ └─────┴───────────────┘ │
├─────────────────────────┤
│ SUBTOTAL         $258   │
│ [CHECKOUT →]            │
└─────────────────────────┘
```

### Category Pages
- **Filter sidebar** - Collapsible on mobile
- **Sort dropdown** - Sticky below header
- **Load more** - Infinite scroll on mobile
- **Grid/List toggle** - Desktop only

---

## ✅ IMPLEMENTATION CHECKLIST

### Immediate Fixes (Phase 1)
- [ ] Fix button consistency - all buttons use same radius
- [ ] Update hero section - implement carousel design
- [ ] Fix mobile typography - proper scaling
- [ ] Add category carousel to homepage
- [ ] Implement consistent spacing system

### Short-term (Phase 2)
- [ ] Create reusable component library
- [ ] Implement animation system
- [ ] Add quick view functionality
- [ ] Optimize image loading
- [ ] Build filter system

### Long-term (Phase 3)
- [ ] Advanced product customization
- [ ] AR try-on features
- [ ] Personalization engine
- [ ] Social commerce integration

---

## 🚫 WHAT NOT TO DO

1. **BALANCED DESIGN SYSTEM** - Sharp for content (cards), rounded for interactions (buttons)
2. **NO GRADIENT OVERUSE** - Solid colors are stronger
3. **NO SMALL TOUCH TARGETS** - Min 44x44px on mobile
4. **NO AUTO-PLAYING VIDEOS** on mobile (data concerns)
5. **NO HELVETICA NEUE FOR BODY TEXT** - Headers only
6. **NO CENTERED BODY TEXT** - Left-align for readability
7. **NO LIGHT GRAY TEXT** on white - Maintain AA contrast

---

## 📐 RESPONSIVE BREAKPOINTS

```css
/* Mobile First Approach */
--mobile: 0px;        /* Base styles */
--tablet: 768px;      /* iPad portrait */
--desktop: 1024px;    /* Laptop */
--wide: 1440px;      /* Desktop */
--ultrawide: 1920px; /* Large monitors */
```

---

## 🎯 SUCCESS METRICS

A successful implementation will achieve:
1. **Mobile Conversion Rate**: >3.5%
2. **Page Load Speed**: <2s on 4G
3. **Interaction to Next Paint**: <200ms
4. **Cart Abandonment**: <65%
5. **Visual Consistency Score**: 100%

---

*Last Updated: 2025-01-04*
*Version: 1.0 - Initial Design System*