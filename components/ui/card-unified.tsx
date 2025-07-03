import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Unified Card Components
 * 
 * Consistent card patterns for the entire application.
 * All cards follow the same elevation and interaction patterns.
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Make card clickable with hover effects */
  clickable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    clickable = false,
    ...props 
  }, ref) => {
    const baseStyles = 'relative overflow-hidden bg-card text-card-foreground';
    
    const variantStyles = {
      default: 'border border-border',
      bordered: 'border-2 border-border',
      elevated: 'border border-border shadow-md',
      interactive: 'border border-border transition-all duration-200 hover:border-foreground hover:shadow-lg',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const clickableStyles = clickable 
      ? 'cursor-pointer transition-all duration-200 hover:border-foreground hover:shadow-md active:scale-[0.99]' 
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          clickableStyles,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('', className)} 
    {...props} 
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

/**
 * Product Card Component
 * 
 * Specialized card for product displays with image optimization.
 */
interface ProductCardProps extends CardProps {
  /** Aspect ratio for the product image */
  aspectRatio?: '1/1' | '3/4' | '4/3' | '16/9';
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ aspectRatio = '3/4', className, children, ...props }, ref) => {
    const aspectStyles = {
      '1/1': 'aspect-square',
      '3/4': 'aspect-[3/4]',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-video',
    };

    return (
      <Card
        ref={ref}
        variant="interactive"
        padding="none"
        clickable
        className={cn('group', className)}
        {...props}
      >
        <div className={cn('relative overflow-hidden bg-gray-100', aspectStyles[aspectRatio])}>
          {/* Image content goes here */}
        </div>
        <div className="p-4">
          {children}
        </div>
      </Card>
    );
  }
);
ProductCard.displayName = 'ProductCard';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ProductCard,
};