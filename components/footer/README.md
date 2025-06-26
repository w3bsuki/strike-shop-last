# Footer Components

A modular, accessible, and responsive footer system following shadcn patterns.

## Components Overview

### Main Components

- **Footer** - Main container component that orchestrates all footer sections
- **FooterSection** - Column section wrapper with title and navigation
- **FooterNewsletter** - Email subscription form with preferences
- **FooterBottom** - Copyright, localization, and social links
- **FooterLogo** - Brand logo and tagline

### Sub-components

- **FooterHeader** - Section title styling
- **FooterNav** - Navigation list wrapper
- **FooterLink** - Styled link component
- **FooterSocial** - Social media links

## Usage

### Basic Usage

```tsx
import { Footer } from '@/components/footer';
import { footerConfig } from '@/config/footer';

export default function MyApp() {
  return (
    <Footer 
      config={footerConfig}
      onNewsletterSubmit={(email, preferences) => {
        // Handle newsletter submission
      }}
    />
  );
}
```

### Footer Variants

```tsx
// Default footer with all sections
<Footer config={footerConfig} />

// Minimal footer with fewer sections
<Footer config={minimalFooterConfig} variant="minimal" />

// Compact single-row footer
<Footer config={compactFooterConfig} variant="compact" />
```

### Custom Configuration

```tsx
const customConfig: FooterConfig = {
  sections: [
    {
      title: 'Products',
      links: [
        { label: 'New Arrivals', href: '/new' },
        { label: 'Best Sellers', href: '/best-sellers' },
      ],
    },
  ],
  social: [
    { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  ],
  newsletter: {
    title: 'Stay Updated',
    description: 'Get the latest news.',
    placeholder: 'Your email',
    preferences: ['Updates', 'Offers'],
  },
  company: {
    name: 'Your Brand',
    tagline: 'Your tagline',
  },
  legal: {
    copyright: '© 2024 Your Brand',
  },
  localization: {
    country: 'US',
    language: 'EN',
  },
};
```

## Features

### Accessibility
- Semantic HTML structure
- ARIA labels for social links
- Keyboard navigation support
- Form labels properly associated

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Stacked layout on small screens
- Horizontal layout on larger screens

### SEO Friendly
- Semantic markup
- Proper heading hierarchy
- External links with rel attributes
- Structured data ready

### Performance
- Modular components for code splitting
- Lazy loading support
- Minimal re-renders with proper state management

## Component Props

### Footer Props
```typescript
interface FooterProps {
  config: FooterConfig;
  className?: string;
  variant?: 'default' | 'minimal' | 'compact';
  onNewsletterSubmit?: (email: string, preferences: string[]) => void;
}
```

### FooterConfig Structure
```typescript
interface FooterConfig {
  sections: FooterSection[];
  social: SocialLink[];
  newsletter: {
    title: string;
    description: string;
    placeholder: string;
    preferences: string[];
  };
  company: {
    name: string;
    logo?: string;
    tagline?: string;
  };
  legal: {
    copyright: string;
    registration?: string;
  };
  localization: {
    country: string;
    language: string;
  };
}
```

## Styling

The footer components use CSS variables for consistent theming:

```css
/* Available CSS variables */
--subtle-text-color: #6b7280;
--border-subtle: #e5e7eb;
```

## Best Practices

1. **Newsletter Handling**: Always provide feedback when newsletter form is submitted
2. **External Links**: Social media links open in new tabs with proper security attributes
3. **Mobile Experience**: Test footer on various screen sizes
4. **Accessibility**: Ensure all interactive elements are keyboard accessible
5. **Performance**: Use the variant prop to load only necessary sections