# Mobile Components

A comprehensive set of mobile-first components designed for touch interfaces, optimized performance, and excellent user experience.

## Navigation Components

### MobileNav
The main mobile navigation component with scroll-triggered visibility.

```tsx
import { MobileNav } from '@/components/mobile/navigation';

<MobileNav 
  variant="default" // 'default' | 'minimal' | 'floating'
  showLabels={true}
  showThreshold={0.65} // Percentage of viewport height
/>
```

### MobileNavContainer
Container component for custom mobile navigation layouts.

### MobileNavItem
Individual navigation items with haptic feedback support.

### MobileNavIcon
Icon wrapper with badge support for notifications.

### MobileNavLabel
Accessible labels for navigation items.

### MobileNavIndicator
Visual indicators for active navigation states.

## Social Proof Components

### SocialProofSection
Comprehensive social proof section with multiple display modes.

```tsx
import { SocialProofSection } from '@/components/mobile/social-proof';

<SocialProofSection
  variant="mixed" // 'instagram' | 'reviews' | 'testimonials' | 'mixed'
  title="Join Our Community"
  subtitle="See what our customers are saying"
/>
```

### TestimonialCard
Individual testimonial display with rating and verification.

### InstagramFeed
Instagram-style feed with multiple layouts (grid, carousel, stories).

### ReviewCarousel
Touch-friendly review carousel with auto-play support.

## Mobile Utilities

### MobileScrollLock
Prevents background scrolling when modals/drawers are open.

### MobileTouchTarget
Ensures minimum touch target sizes for accessibility.

### MobilePullToRefresh
Native-like pull-to-refresh functionality.

### MobileDrawer
Bottom sheet / drawer component with swipe gestures.

### MobileFixedPosition
Helper for fixed positioning with safe area support.

### MobileGestureHandler
Advanced gesture detection (swipe, pinch, long press, double tap).

## Features

- **Touch-Optimized**: All components follow iOS/Android HIG guidelines
- **Haptic Feedback**: Native vibration feedback for interactions
- **Gesture Support**: Swipe, pinch, and other touch gestures
- **Performance**: Lazy loading and optimized rendering
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
- **Safe Areas**: Full support for notched devices

## Usage Example

```tsx
// In your layout or page component
import { 
  MobileNav, 
  SocialProofSection,
  MobileDrawer 
} from '@/components/mobile';

export default function MobileLayout({ children }) {
  return (
    <>
      {children}
      <MobileNav variant="default" />
      <SocialProofSection variant="mixed" />
    </>
  );
}
```

## Best Practices

1. **Touch Targets**: Always use MobileTouchTarget for interactive elements
2. **Scroll Locking**: Use MobileScrollLock when showing overlays
3. **Gestures**: Implement gesture handlers for native-like interactions
4. **Performance**: Lazy load components below the fold
5. **Testing**: Test on real devices for haptic feedback